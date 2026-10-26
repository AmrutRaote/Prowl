import { createHmac, timingSafeEqual } from "crypto";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";import { syncInstallation } from "@/features/github/sync-installation";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const expectedSignature =
    "sha256=" +
    createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const payload = JSON.parse(body);
  const installationId = payload.installation?.id;

  if (!installationId) {
    return Response.json({ ok: true });
  }

  if (event === "installation" && payload.action === "deleted") {
    await prisma.gitHubInstallation.deleteMany({
      where: {
        githubInstallationId: String(installationId),
      },
    });
  }

  if (event === "installation" && payload.action === "suspend") {
    await prisma.gitHubInstallation.updateMany({
      where: {
        githubInstallationId: String(installationId),
      },
      data: {
        status: "SUSPENDED",
      },
    });
  }

  if (
    (event === "installation" &&
      ["created", "unsuspend", "new_permissions_accepted"].includes(
        payload.action,
      )) ||
    event === "installation_repositories"
  ) {
    await syncInstallation(installationId);
  }

  if (event === "pull_request") {
    const action = payload.action;

    if (["opened", "synchronize", "reopened"].includes(action)) {
      const githubRepositoryId = String(payload.repository.id);
      const repository = await prisma.gitHubRepository.findUnique({
        where: { githubRepositoryId },
        select: {
          installation: {
            select: { userId: true, user: { select: { maxPrReviews: true } } },
          },
        },
      });
      const userId = repository?.installation.userId;
      const maxPrReviews = repository?.installation.user?.maxPrReviews ?? 0;

      // Re-reviews of an already-counted PR are free; only new PRs consume quota.
      if (userId) {
        const existing = await prisma.pullRequestReview.findUnique({
          where: {
            githubRepositoryId_githubPrNumber: {
              githubRepositoryId,
              githubPrNumber: payload.pull_request.number,
            },
          },
        });
        const used = await prisma.pullRequestReview.count({
          where: { repository: { installation: { userId } } },
        });
        if (!existing && used >= maxPrReviews) {
          return Response.json({ ok: true, skipped: "review limit reached" });
        }
      }

      await inngest.send({
        name: "pr/review.requested",
        data: {
          installationId,
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          prNumber: payload.pull_request.number,
          prTitle: payload.pull_request.title,
          prAuthor: payload.pull_request.user.login,
          prUrl: payload.pull_request.html_url,
          githubRepositoryId: String(payload.repository.id),
          prBody: payload.pull_request.body ?? "",
        },
      });
    }
  }

  return Response.json({ ok: true });
}
