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

  const reviews = await prisma.pullRequestReview.findMany({
    where: {
      repository: {
        installation: { userId: session.user.id },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return Response.json({ reviews });
}
