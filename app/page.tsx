export const instant = false;

import { requireAuth } from "@/features/auth/actions";
import { Dashboard } from "@/features/dashboard/components/dashboard";
import prisma from "@/lib/db";

export default async function Home() {
  const session = await requireAuth();
  const installations = await prisma.gitHubInstallation.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          repositories: true,
        },
      },
      repositories: {
        orderBy: {
          fullName: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <Dashboard
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      installations={installations.map((installation) => ({
        id: installation.id,
        githubInstallationId: installation.githubInstallationId,
        targetLogin: installation.targetLogin,
        targetType: installation.targetType,
        status: installation.status,
        repositorySelection: installation.repositorySelection,
        repoCount: installation._count.repositories,
      }))}
    />
  );
}
