import { inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";import { headers } from "next/headers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const repository = await prisma.gitHubRepository.findFirst({
    where: {
      id,
      installation: { userId: session.user.id },
    },
  });

  if (!repository) {
    return Response.json({ error: "Repository not found" }, { status: 404 });
  }

  if (repository.indexStatus === "NOT_INDEXED") {
    const used = await prisma.gitHubRepository.count({
      where: {
        installation: { userId: session.user.id },
        indexStatus: { not: "NOT_INDEXED" },
      },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { maxRepos: true },
    });
    if (used >= user.maxRepos) {
      return Response.json(
        { error: `Limit reached: you can connect up to ${user.maxRepos} repositories` },
        { status: 403 },
      );
    }
  }

  await prisma.gitHubRepository.update({
    where: { id: repository.id },
    data: { indexStatus: "INDEXING", indexedAt: null },
  });

  await inngest.send({
    name: "repo/index.requested",
    data: { repositoryId: repository.id },
  });

  return Response.json({ ok: true, message: "Indexing started" });
}
