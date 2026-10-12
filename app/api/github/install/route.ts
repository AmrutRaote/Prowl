import { appUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(appUrl("/sign-in"));
  }

  const state = randomUUID();
  const installUrl = new URL(
    `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`,
  );
  installUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(installUrl);
  response.cookies.set("github_install_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
