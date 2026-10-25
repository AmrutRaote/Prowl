import prisma from "@/lib/db";
import { getInstallationOctokit, githubApp } from "./github-app";


export async function syncInstallation(
    githubInstallationId: number,
    userId?: string,
) { 
    let installation;
    try {
        const response = await githubApp.octokit.rest.apps.getInstallation({
            installation_id: githubInstallationId
        });
        installation = response.data;
    } catch (appAuthError: any) {
        if (appAuthError?.status === 401) {
            throw new Error(`GitHub App authentication failed (Bad credentials). Please check GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY_PATH in your .env file.`);
        }
        throw appAuthError;
    }

    const octokit = await getInstallationOctokit(githubInstallationId)
    const repositories = await octokit.paginate(
        octokit.rest.apps.listReposAccessibleToInstallation,
        { per_page: 100 },
        (response) => response.data,
    );

    const account = installation.account as {
        id: number;
        login?: string;
        slug?: string;
    };

    
  await prisma.$transaction(async (tx) => {
    const savedInstallation = await tx.gitHubInstallation.upsert({
      where: {
        githubInstallationId: String(githubInstallationId),
      },
      create: {
        githubInstallationId: String(githubInstallationId),
        targetId: String(installation.target_id),
        targetLogin: account.login ?? account.slug ?? "unknown",
        targetType: installation.target_type,
        repositorySelection: installation.repository_selection,
        status: installation.suspended_at ? "SUSPENDED" : "ACTIVE",
        userId,
      },
      update: {
        targetId: String(installation.target_id),
        targetLogin: account.login ?? account.slug ?? "unknown",
        targetType: installation.target_type,
        repositorySelection: installation.repository_selection,
        status: installation.suspended_at ? "SUSPENDED" : "ACTIVE",
        ...(userId ? { userId } : {}),
      },
    });

    const repositoryIds = repositories.map((repository) =>
      String(repository.id),
    );

    await tx.gitHubRepository.deleteMany({
      where: {
        OR: [
          { installationId: savedInstallation.id },
          { githubRepositoryId: { in: repositoryIds } },
        ],
      },
    });

    await tx.gitHubRepository.createMany({
      data: repositories.map((repository) => ({
        githubRepositoryId: String(repository.id),
        nodeId: repository.node_id,
        owner: repository.owner.login,
        name: repository.name,
        fullName: repository.full_name,
        private: repository.private,
        defaultBranch: repository.default_branch,
        installationId: savedInstallation.id,
      })),
    });
    // Defaults are maxWait 2s / timeout 5s, too tight for a remote DB (P2028).
  }, { maxWait: 15_000, timeout: 30_000 });
}
