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

  const where = { repository: { installation: { userId: session.user.id } } };

  const [reviews, used, user] = await Promise.all([
    prisma.pullRequestReview.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.pullRequestReview.count({ where }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { maxPrReviews: true },
    }),
  ]);

  return Response.json({ reviews, limitReached: used >= user.maxPrReviews });
}
