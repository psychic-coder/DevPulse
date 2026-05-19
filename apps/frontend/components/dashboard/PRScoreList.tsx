import { useState } from "react";

type PRItem = {
  id: string;
  title: string;
  repo: string;
  state: "open" | "closed" | "merged";
  created_at: string;
  url?: string;
  prScore?: number | null;
  prScoreReason?: string | null;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
};

function scoreColor(score?: number | null) {
  if (typeof score !== "number") return "#64748b";
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#3b82f6";
  if (score >= 4) return "#f59e0b";
  return "#ef4444";
}

export function PRScoreList({ pullRequests }: { pullRequests: PRItem[] }) {
  const [openReasonId, setOpenReasonId] = useState<string | null>(null);
  const sorted = [...pullRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const toggleReason = (id: string) => {
    setOpenReasonId((current) => (current === id ? null : id));
  };

  const openPr = (url?: string) => {
    if (!url || url === "#") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getPrNumber = (url?: string) => {
    if (!url) return null;
    const match = url.match(/\/pull\/(\d+)/);
    return match?.[1] ?? null;
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Review</p>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Recent PRs with AI Scores</h3>
      </div>

      <div className="space-y-3">
        {sorted.slice(0, 6).map((pr) => (
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
                <p className="block font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
                  {pr.title}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
                  {getPrNumber(pr.url) ? `PR #${getPrNumber(pr.url)}` : "PR"} • {new Date(pr.created_at).toLocaleDateString()} • {pr.changedFiles ?? 0} files • +{pr.additions ?? 0} / -{pr.deletions ?? 0}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold" style={{ color: scoreColor(pr.prScore) }}>
                  {typeof pr.prScore === "number" ? pr.prScore.toFixed(1) : "--"}
                  <span className="ml-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--text-dim)" }}>
                    /10
                  </span>
                </p>
                <div className="mt-2 flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReason(pr.id)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/5"
                    style={{ borderColor: "rgba(99,179,237,0.16)", color: "var(--text-primary)" }}
                    aria-expanded={openReasonId === pr.id}
                    aria-label={`Toggle AI review for ${pr.title}`}
                  >
                    View AI Review
                  </button>
                  <button
                    type="button"
                    onClick={() => openPr(pr.url)}
                    disabled={!pr.url || pr.url === "#"}
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors enabled:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: "rgba(99,179,237,0.16)", color: "var(--text-primary)" }}
                    aria-label={`Open PR link for ${pr.title}`}
                  >
                    Open PR
                  </button>
                </div>
              </div>
            </div>

            {openReasonId === pr.id ? (
              <div className="mt-3 rounded-xl border px-3 py-2 text-sm leading-relaxed" style={{ borderColor: "rgba(99,179,237,0.12)", color: "var(--text-secondary)" }}>
                <p className="text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--text-dim)" }}>
                  AI reason
                </p>
                <p>{pr.prScoreReason || "AI review reason is not available yet. Trigger a sync to regenerate it."}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
