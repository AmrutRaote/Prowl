import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userFilter = {
    installation: { userId: session.user.id },
  };

  const [
    installations,
    repositories,
    indexedRepositories,
    pullRequestReviews,
    completedReviews,
    recentReviews,
    recentRepositories,
  ] = await Promise.all([
    prisma.gitHubInstallation.count({
      where: { userId: session.user.id },
    }),
    prisma.gitHubRepository.count({ where: userFilter }),
    prisma.gitHubRepository.count({
      where: { ...userFilter, indexStatus: "INDEXED" },
    }),
    prisma.pullRequestReview.count({
      where: { repository: userFilter },
    }),
    prisma.pullRequestReview.count({
      where: { repository: userFilter, status: "COMPLETED" },
    }),
    prisma.pullRequestReview.findMany({
      where: { repository: userFilter },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.gitHubRepository.findMany({
      where: { ...userFilter, indexStatus: "INDEXED" },
      orderBy: { indexedAt: "desc" },
      take: 5,
    }),
  ]);

  return Response.json({
    stats: {
      installations,
      repositories,
      indexedRepositories,
      pullRequestReviews,
      completedReviews,
    },
    recentReviews,
    recentRepositories,
  });
}
