import Link from "next/link";

type PRItem = {
  id: string;
  title: string;
  repo: string;
  state: "open" | "closed" | "merged";
  created_at: string;
  url?: string;
  prScore?: number | null;
  prScoreReason?: string | null;
};

function scoreColor(score?: number | null) {
  if (typeof score !== "number") return "#64748b";
  if (score >= 0.8) return "#22c55e";
  if (score >= 0.6) return "#3b82f6";
  if (score >= 0.4) return "#f59e0b";
  return "#ef4444";
}

export function PRScoreList({ pullRequests }: { pullRequests: PRItem[] }) {
  const sorted = [...pullRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Review</p>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Recent PRs with AI Scores</h3>
      </div>

      <div className="space-y-3">
        {sorted.slice(0, 6).map((pr, index) => (
          <div
            key={pr.id}
            className="rounded-2xl border p-4"
            style={{ borderColor: "rgba(99,179,237,0.12)", background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge">{pr.state}</span>
                  <span className="text-xs" style={{ color: "var(--text-dim)" }}>{pr.repo}</span>
                </div>
                <Link href={pr.url || "#"} className="block font-medium leading-snug hover:text-blue-300" style={{ color: "var(--text-primary)" }}>
                  {pr.title}
                </Link>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold" style={{ color: scoreColor(pr.prScore) }}>
                  {typeof pr.prScore === "number" ? Math.round(pr.prScore * 100) : "--"}
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--text-dim)" }}>score</div>
              </div>
            </div>

            {pr.prScoreReason ? (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {pr.prScoreReason}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
