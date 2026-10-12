"use client";

import { useQuery } from "@tanstack/react-query";

type User = {
  name: string;
  email: string;
};

async function fetchOverview() {
  const response = await fetch("/api/overview");
  return response.json();
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function OverviewTab({ user }: { user: User }) {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
  });

  const stats = data?.stats ?? {
    installations: 0,
    repositories: 0,
    indexedRepositories: 0,
    pullRequestReviews: 0,
    completedReviews: 0,
  };

  const recentReviews = data?.recentReviews ?? [];
  const recentRepositories = data?.recentRepositories ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Welcome back, {user.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is what Prowl has been doing for your repos.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading overview...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Installations"
              value={stats.installations}
              hint="GitHub App connections"
            />
            <StatCard
              label="Repositories"
              value={stats.repositories}
              hint="Synced from GitHub"
            />
            <StatCard
              label="Indexed"
              value={stats.indexedRepositories}
              hint="Ready for code search"
            />
            <StatCard
              label="PR Reviews"
              value={stats.completedReviews}
              hint={`${stats.pullRequestReviews} total`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border bg-background p-5">
              <h3 className="font-medium">Recent PR reviews</h3>
              {recentReviews.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No PR reviews yet. Open a pull request to get started.
                </p>
              ) : (
                <div className="mt-4 divide-y">
                  {recentReviews.map((review: {
                    id: string;
                    fullName: string;
                    githubPrNumber: number;
                    title: string;
                    status: string;
                    updatedAt: string;
                    prUrl: string;
                  }) => (
                    <a
                      key={review.id}
                      href={review.prUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block py-3 hover:bg-muted/30"
                    >
                      <p className="font-medium">
                        {review.fullName} #{review.githubPrNumber}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {review.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.status} ·{" "}
                        {new Date(review.updatedAt).toLocaleString()}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border bg-background p-5">
              <h3 className="font-medium">Recently indexed repos</h3>
              {recentRepositories.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No indexed repos yet. Go to Repositories and click Index.
                </p>
              ) : (
                <div className="mt-4 divide-y">
                  {recentRepositories.map((repo: {
                    id: string;
                    fullName: string;
                    indexedAt: string | null;
                  }) => (
                    <div key={repo.id} className="py-3">
                      <p className="font-medium">{repo.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Indexed{" "}
                        {repo.indexedAt
                          ? new Date(repo.indexedAt).toLocaleString()
                          : "recently"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
