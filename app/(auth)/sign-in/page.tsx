export const instant = false;

import Image from "next/image";
import { CircleAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { requireUnAuth } from "@/features/auth/actions";
import { GithubSignInButton } from "@/features/auth/components/github-sign-in-button";

export default async function SignInPage() {
    await requireUnAuth();

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-2 text-center">
                <Image
                    src="/prowl-logo.png"
                    alt="Prowl"
                    width={100}
                    height={100}
                    className="mx-auto size-40 object-contain"
                    priority
                />
                <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-semibold">Welcome to Prowl</h1>
                    <Tooltip>
                        <TooltipTrigger
                            aria-label="What does Prowl do?"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <CircleAlert className="size-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                            Prowl reviews your GitHub pull requests with AI and posts feedback automatically.
                        </TooltipContent>
                    </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground">
                    Sign in with GitHub to continue
                </p>
            </div>
            <GithubSignInButton />
            <p className="text-center text-xs text-muted-foreground">
                Go ahead, it&apos;s free and totally safe
            </p>
        </div>
    );
}
