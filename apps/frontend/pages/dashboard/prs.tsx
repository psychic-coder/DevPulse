import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { PRScoreList } from "../../components/dashboard/PRScoreList";
import { useDashboardData } from "../../hooks/useDashboardData";

export default function DashboardPrsPage() {
  const router = useRouter();
  const { user, loading, syncing, pullRequests, syncNow } = useDashboardData();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, router, user]);

  const scoreSummary = useMemo(() => {
    const scores = pullRequests.map((pr) => pr.prScore).filter((score): score is number => typeof score === "number");
    if (scores.length === 0) return { average: "--", scored: 0 };
    return {
      average: `${Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100)}/100`,
      scored: scores.length,
    };
  }, [pullRequests]);

  if (loading || !user) return null;

  return (
    <DashboardShell active="prs" title="PR Review Scores" description="AI-assisted scoring for review quality and merge readiness." username={user.githubUsername} syncing={syncing} onSync={syncNow}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Average score</p>
            <p className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{scoreSummary.average}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Scored PRs</p>
            <p className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{scoreSummary.scored ?? 0}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Recent review</p>
            <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>Scores are generated from the latest synced PR metadata.</p>
          </div>
        </div>

        <PRScoreList pullRequests={pullRequests} />
      </div>
    </DashboardShell>
  );
}
