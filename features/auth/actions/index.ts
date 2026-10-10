"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"


async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
      // redirect(AUTH_ROUTES.signIn);
      redirect("/sign-in")
    }
    
    return session;
}

export async function requireUnAuth() {
    const session = await getSession();
    
    if (session) {
        // redirect(AUTH_ROUTES.home);
        redirect("/")
  }
}

export async function signInWithGithub() {
  const result = await auth.api.signInSocial({
    body: {
      provider: "github",
    },
  });

//   redirect(result.url ?? AUTH_ROUTES.home);
  redirect(result.url ?? "/");
}

export async function signOut() {
  await auth.api.signOut({
    headers: await headers(),
  });

//   redirect(AUTH_ROUTES.signIn);
  redirect("/sign-in")
}
