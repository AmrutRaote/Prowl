"use client";

import { Button } from "@/components/ui/button";
import { signInWithGithub } from "../actions";

export function GithubSignInButton() {
  return (
    <form action={signInWithGithub}>
      <Button type="submit" size="lg" className="w-full">
        Sign in with GitHub
      </Button>
    </form>
  );
}
