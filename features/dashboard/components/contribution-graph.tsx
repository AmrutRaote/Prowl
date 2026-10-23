"use client";

import { useQuery } from "@tanstack/react-query";

type Day = { date: string; contributionCount: number; contributionLevel: string };

// GitHub's own light/dark palettes
const LEVELS: Record<string, string> = {
  NONE: "bg-[#ebedf0] dark:bg-[#161b22]",
  FIRST_QUARTILE: "bg-[#9be9a8] dark:bg-[#0e4429]",
  SECOND_QUARTILE: "bg-[#40c463] dark:bg-[#006d32]",
  THIRD_QUARTILE: "bg-[#30a14e] dark:bg-[#26a641]",
  FOURTH_QUARTILE: "bg-[#216e39] dark:bg-[#39d353]",
};

const CELL = 10;
const GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

async function fetchContributions() {
  const response = await fetch("/api/contributions");
  const json = await response.json();
  if (!response.ok) throw new Error(json.error);
  return json as { totalContributions: number; weeks: { contributionDays: Day[] }[] };
}

const month = (date: string) =>
  new Date(date + "T00:00:00").toLocaleString("en", { month: "short" });

export function ContributionGraph() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["contributions"],
    queryFn: fetchContributions,
    retry: false,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading contributions...</p>;
  if (error || !data) {
    return <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>;
  }

  // label a column when its month differs from the previous column's;
  // skip the first label if the next month starts within 2 columns (it would overlap)
  const labels = data.weeks.map((w, i) => {
    const m = month(w.contributionDays[0].date);
    return i === 0 || m !== month(data.weeks[i - 1].contributionDays[0].date) ? m : "";
  });
  if (labels[1] || labels[2]) labels[0] = "";

  return (
    <div>
      <h3 className="text-base font-normal">
        {data.totalContributions.toLocaleString()} contributions in the last year
      </h3>

      <div className="mt-3 overflow-x-auto rounded-md border p-4">
        <div className="flex w-max text-xs text-muted-foreground" style={{ gap: GAP }}>
          <div className="flex flex-col pr-2" style={{ gap: GAP, paddingTop: 16 + GAP }}>
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="leading-none" style={{ height: CELL }}>
                {d && <span className="relative -top-[1px]">{d}</span>}
              </span>
            ))}
          </div>

          {data.weeks.map((week, i) => (
            <div key={i} className="flex flex-col" style={{ gap: GAP }}>
              <div className="relative h-4">
                <span className="absolute left-0 top-0 whitespace-nowrap">{labels[i]}</span>
              </div>
              {week.contributionDays.map((d) => (
                <div
                  key={d.date}
                  title={`${d.contributionCount} contribution${d.contributionCount === 1 ? "" : "s"} on ${d.date}`}
                  className={`rounded-[2px] outline outline-1 -outline-offset-1 outline-black/5 dark:outline-white/5 ${LEVELS[d.contributionLevel]}`}
                  style={{ width: CELL, height: CELL }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <a
            href="https://docs.github.com/articles/why-are-my-contributions-not-showing-up-on-my-profile"
            target="_blank"
            rel="noreferrer"
            className="hover:text-blue-500 hover:underline"
          >
            Learn how we count contributions
          </a>
          <div className="flex items-center" style={{ gap: GAP }}>
            <span className="mr-1">Less</span>
            {Object.values(LEVELS).map((c) => (
              <div key={c} className={`rounded-[2px] ${c}`} style={{ width: CELL, height: CELL }} />
            ))}
            <span className="ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
