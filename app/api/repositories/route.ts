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
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const repositories = await prisma.gitHubRepository.findMany({
    where: {
      installation: { userId: session.user.id },
      ...(search
        ? { fullName: { contains: search, mode: "insensitive" } }
        : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { fullName: "asc" },
    include: {
      installation: {
        select: { targetLogin: true },
      },
    },
  });

  const hasMore = repositories.length > limit;
  const items = hasMore ? repositories.slice(0, limit) : repositories;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return Response.json({ repositories: items, nextCursor });
}
