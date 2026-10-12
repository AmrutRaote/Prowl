"use client";

import { buttonVariants } from "@/components/ui/button";
import { deleteInstallation } from "@/features/dashboard/actions/delete-installation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type User = {
  name: string;
  email: string;
  image?: string | null;
};

type Installation = {
  id: string;
  githubInstallationId: string;
  targetLogin: string;
  targetType: string;
  status: string;
  repositorySelection: string;
  repoCount: number;
};

export function SettingsTab({
  user,
  installations,
}: {
  user: User;
  installations: Installation[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(installationId: string) {
    setDeletingId(installationId);
    await deleteInstallation(installationId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account and GitHub App connections.
        </p>
      </div>

      <section className="rounded-2xl border bg-background p-6">
        <h3 className="text-lg font-medium">Account</h3>
        <div className="mt-4 flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="size-12 rounded-full"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Signed in
          </span>
        </div>
      </section>

      <section className="rounded-2xl border bg-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">GitHub App</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Install the app on your account or organization.
            </p>
          </div>
          {installations.length > 0 ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Connected
            </span>
          ) : (
            <a
              href="/api/github/install"
              className={cn(buttonVariants())}
            >
              Connect GitHub App
            </a>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {installations.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No GitHub App installation connected yet.
            </div>
          ) : (
            installations.map((installation) => (
              <div
                key={installation.id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{installation.targetLogin}</p>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                        {installation.targetType}
                      </span>
                      {installation.status === "ACTIVE" ? (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                          {installation.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {installation.repoCount} repositories ·{" "}
                      {installation.repositorySelection} access
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400">
                        ✓ App installed
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400">
                        ✓ Repos synced
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://github.com/settings/installations/${installation.githubInstallationId}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Configure on GitHub
                    </a>
                    <button
                      type="button"
                      disabled={deletingId === installation.id}
                      onClick={() => handleDelete(installation.id)}
                      className={cn(
                        buttonVariants({ variant: "destructive", size: "sm" }),
                      )}
                    >
                      {deletingId === installation.id
                        ? "Removing..."
                        : "Remove installation"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
