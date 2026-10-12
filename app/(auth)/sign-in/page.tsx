export const instant = false;

import { requireUnAuth } from "@/features/auth/actions";
import { GithubSignInButton } from "@/features/auth/components/github-sign-in-button";

export default async function SignInPage() {
    await requireUnAuth();

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold">Welcome to Prowl</h1>
                <p className="text-sm text-muted-foreground">
                    Sign in with GitHub to continue
                </p>
            </div>
            <GithubSignInButton />
        </div>
    );
}
