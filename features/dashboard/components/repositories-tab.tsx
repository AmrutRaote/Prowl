"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

type Repository = {
  id: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  indexStatus: string;
  indexedAt: string | null;
  installation: {
    targetLogin: string;
  };
};

async function fetchRepositories(search: string, cursor?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/repositories?${params}`);
  return response.json();
}

async function startIndexing(repositoryId: string) {
  const response = await fetch(`/api/repositories/${repositoryId}/index`, {
    method: "POST",
  });
  return response.json();
}

function IndexButton({
  repository,
  onIndex,
}: {
  repository: Repository;
  onIndex: (id: string) => void;
}) {
  if (repository.indexStatus === "INDEXING") {
    return (
      <Button size="sm" variant="outline" disabled>
        Indexing...
      </Button>
    );
  }

  if (repository.indexStatus === "INDEXED") {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
          Indexed
        </span>
        <Button size="sm" variant="outline" onClick={() => onIndex(repository.id)}>
          Re-index
        </Button>
      </div>
    );
  }

  if (repository.indexStatus === "FAILED") {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          Failed
        </span>
        <Button size="sm" variant="outline" onClick={() => onIndex(repository.id)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={() => onIndex(repository.id)}>
      Index
    </Button>
  );
}

export function RepositoriesTab() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ["repositories", debouncedSearch],
      queryFn: ({ pageParam }) =>
        fetchRepositories(debouncedSearch, pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      refetchInterval: (query) => {
        const repos =
          query.state.data?.pages.flatMap(
            (page) => page.repositories as Repository[],
          ) ?? [];

        const isIndexing = repos.some((repo) => repo.indexStatus === "INDEXING");

        return isIndexing ? 3000 : false;
      },
    });

  const { hiddenCount = 0, maxRepos } = data?.pages[0] ?? {};
  const repositories =
    data?.pages.flatMap((page) => page.repositories as Repository[]) ?? [];

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  async function handleIndex(repositoryId: string) {
    await startIndexing(repositoryId);
    refetch();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Repositories</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All repos from your connected GitHub App installations.
        </p>
      </div>

      {hiddenCount > 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Easy there, repo collector! You can only add {maxRepos}{" "}
          repos. The other {hiddenCount} are hiding until Prowl
          wins the lottery.
        </p>
      )}

      <Input
        type="search"
        placeholder="Search repositories..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-md"
      />

      <div className="overflow-hidden rounded-2xl border bg-background">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading repositories...
          </p>
        ) : repositories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No repositories found.
          </p>
        ) : (
          <div className="divide-y">
            {repositories.map((repository) => (
              <div
                key={repository.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{repository.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {repository.installation.targetLogin} ·{" "}
                    {repository.defaultBranch}
                    {repository.indexedAt && (
                      <> · indexed {new Date(repository.indexedAt).toLocaleString()}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {repository.private ? "Private" : "Public"}
                  </span>
                  <IndexButton repository={repository} onIndex={handleIndex} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={loadMoreRef} className="h-4" />

        {isFetchingNextPage && (
          <p className="pb-4 text-center text-sm text-muted-foreground">
            Loading more...
          </p>
        )}
      </div>
    </div>
  );
}
