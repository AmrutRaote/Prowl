import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const mine = { installation: { userId: session.user.id } };

  const { maxRepos } = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { maxRepos: true },
  });

  // Only the top `maxRepos` are shown; already-indexed repos sort first
  // (FAILED < INDEXED < INDEXING < NOT_INDEXED) so they never get hidden.
  const [repositories, total] = await Promise.all([
    prisma.gitHubRepository.findMany({
      where: {
        ...mine,
        ...(search
          ? { fullName: { contains: search, mode: "insensitive" } }
          : {}),
      },
      take: maxRepos,
      orderBy: [{ indexStatus: "asc" }, { fullName: "asc" }],
      include: {
        installation: {
          select: { targetLogin: true },
        },
      },
    }),
    prisma.gitHubRepository.count({ where: mine }),
  ]);

  return Response.json({
    repositories,
    nextCursor: null,
    maxRepos,
    hiddenCount: Math.max(0, total - maxRepos),
  });
}
