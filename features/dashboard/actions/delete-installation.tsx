"use server";

import prisma from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { githubApp } from "../../github/github-app";

export async function deleteInstallation(installationId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Not signed in");
    }

    const installation = await prisma.gitHubInstallation.findFirst({
        where: {
            id: installationId,
            userId: session.user.id,
        },
    });

    if (!installation) {
        throw new Error("Installation not found");
    }

    await githubApp.octokit.rest.apps.deleteInstallation({
        installation_id: Number(installation.githubInstallationId),
    });

    await prisma.gitHubInstallation.delete({
        where: { id: installation.id },
    });

    revalidatePath("/");
}
