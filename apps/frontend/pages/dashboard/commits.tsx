import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { CommitFrequencyChart } from "../../components/dashboard/CommitFrequencyChart";
import { ActivityHeatmap } from "../../components/dashboard/ActivityHeatmap";
import { RecentCommits } from "../../components/RecentCommits";
import { useDashboardData } from "../../hooks/useDashboardData";

export default function DashboardCommitsPage() {
  const router = useRouter();
  const { user, loading, syncing, commits, syncNow, lastSyncedAt } = useDashboardData();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, router, user]);

  const weekdayData = useMemo(() => {
    const counts = new Map<number, number>();
    commits.forEach((commit) => counts.set(new Date(commit.date).getUTCDay(), (counts.get(new Date(commit.date).getUTCDay()) ?? 0) + 1));
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => ({ day, count: counts.get(index) ?? 0 }));
  }, [commits]);

  if (loading || !user) return null;

  return (
    <DashboardShell active="commits" title="Commits Explorer" description="Explore commit rhythm, heatmap patterns, and the latest changes." username={user.githubUsername} syncing={syncing} onSync={syncNow} lastSyncedAt={lastSyncedAt}>
      <div className="space-y-6">
        <CommitFrequencyChart data={weekdayData} />
        <ActivityHeatmap commits={commits.map((commit) => ({ date: commit.date, count: 1 }))} />
        <RecentCommits commits={commits} />
      </div>
    </DashboardShell>
  );
}
