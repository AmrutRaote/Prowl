import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

const QUERY = `{
  viewer {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "github" },
  });

  if (!account?.accessToken) {
    return Response.json({ error: "No GitHub token. Sign in again." }, { status: 404 });
  }

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${account.accessToken}` },
    body: JSON.stringify({ query: QUERY }),
    next: { revalidate: 3600 },
  });

  const json = await res.json();
  const calendar = json.data?.viewer?.contributionsCollection?.contributionCalendar;

  if (!calendar) {
    // ponytail: no token refresh; an expired token means sign in again
    return Response.json({ error: "Could not load contributions. Sign in again." }, { status: 502 });
  }

  return Response.json(calendar);
}
