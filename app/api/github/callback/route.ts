import { Octokit } from "@octokit/rest";
import prisma from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncInstallation } from "@/features/github/sync-installation";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(appUrl("/sign-in"));
  }

  const installationId = request.nextUrl.searchParams.get("installation_id");
  const setupAction = request.nextUrl.searchParams.get("setup_action");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("github_install_state")?.value;

  if (
    !installationId ||
    !["install", "update"].includes(setupAction ?? "") ||
    !state ||
    state !== savedState
  ) {
    return new Response("Invalid GitHub installation callback", {
      status: 400,
    });
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account) {
    return new Response("GitHub account is not connected", { status: 400 });
  }

  try {
    let accessToken: string | undefined = account.accessToken ?? undefined;
    try {
      const tokenResult = await auth.api.getAccessToken({
        body: {
          accountId: account.accountId,
        },
        headers: request.headers,
      });
      if (tokenResult?.accessToken) {
        accessToken = tokenResult.accessToken;
      }
    } catch (tokenError) {
      console.warn("Could not retrieve refreshed access token, falling back to stored token:", tokenError);
    }

    console.log("[GitHub Callback] Syncing installation via App credentials for installationId:", installationId);
    try {
      await syncInstallation(Number(installationId), session.user.id);
      console.log("[GitHub Callback] Installation synced successfully.");
    } catch (syncError: any) {
      console.error("[GitHub Callback] syncInstallation error:", syncError);
      const isBadCredentials = 
        syncError?.status === 401 || 
        syncError?.message?.includes("Bad credentials") ||
        syncError?.response?.status === 401;

      if (isBadCredentials) {
        return new Response(
          `Failed to process GitHub installation: Bad credentials.
This error means GitHub rejected your GitHub App's credentials.
Please check your .env file:
1. GITHUB_APP_ID (${process.env.GITHUB_APP_ID}) - Ensure this matches the numeric App ID on your GitHub App General settings page.
2. GITHUB_APP_PRIVATE_KEY_PATH (${process.env.GITHUB_APP_PRIVATE_KEY_PATH}) - Ensure this .pem file was generated for this specific GitHub App and has not been revoked.`,
          { status: 500 },
        );
      }

      throw syncError;
    }

    const response = NextResponse.redirect(appUrl("/"));
    response.cookies.delete("github_install_state");

    return response;
  } catch (error) {
    console.error("[GitHub Callback] Error processing GitHub installation callback:", error);
    return new Response(
      `Failed to process GitHub installation: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 },
    );
  }
}
