import Link from "next/link";
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
            className="rounded-2xl border p-4 cursor-pointer"
            style={{ borderColor: "rgba(99,179,237,0.12)", background: "rgba(255,255,255,0.02)" }}
            onClick={() => toggleReason(pr.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleReason(pr.id);
              }
            }}
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
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleReason(pr.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition-colors hover:bg-white/5"
                  style={{
                    borderColor: "rgba(99,179,237,0.16)",
                    color: scoreColor(pr.prScore),
                  }}
                  aria-expanded={openReasonId === pr.id}
                  aria-label={pr.prScoreReason ? `Show AI reason for ${pr.title}` : `PR score for ${pr.title}`}
                  title={pr.prScoreReason || undefined}
                >
                  <span>{typeof pr.prScore === "number" ? pr.prScore.toFixed(1) : "--"}</span>
                  <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--text-dim)" }}>
                    /10
                  </span>
                </button>
              </div>
            </div>

            {pr.prScoreReason && openReasonId === pr.id ? (
              <div className="mt-3 rounded-xl border px-3 py-2 text-sm leading-relaxed" style={{ borderColor: "rgba(99,179,237,0.12)", color: "var(--text-secondary)" }}>
                <p className="text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--text-dim)" }}>
                  AI reason
                </p>
                <p>{pr.prScoreReason}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
