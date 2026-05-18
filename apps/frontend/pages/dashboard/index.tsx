import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/router";
import ActivityFeed from "../../components/ActivityFeed";
import { MostActiveRepos } from "../../components/MostActiveRepos";
import { RecentCommits } from "../../components/RecentCommits";
import { StreakCounter } from "../../components/StreakCounter";
import { AnimatedNumber } from "../../components/dashboard/AnimatedNumber";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { ActivityHeatmap } from "../../components/dashboard/ActivityHeatmap";
import { CommitFrequencyChart } from "../../components/dashboard/CommitFrequencyChart";
import { useDashboardData } from "../../hooks/useDashboardData";
import { DigestPreviewCard } from "../../components/dashboard/DigestPreviewCard";
import { LanguageDonutChart } from "../../components/dashboard/LanguageDonutChart";
import { PeakHourChart } from "../../components/dashboard/PeakHourChart";
import { PRScoreList } from "../../components/dashboard/PRScoreList";

function toUtcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function QuickStat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>
        {label}
      </p>
      <div className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {hint ? (
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function DashboardIndexPage() {
  const router = useRouter();
  const {
    user,
    loading,
    syncing,
    stats,
    repositories,
    commits,
    pullRequests,
    streaks,
    analytics,
    digest,
    todayCommitCount,
    prScoreAverage,
    languageBreakdown,
    syncNow,
  } = useDashboardData();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  const weekdayData = useMemo(() => {
    const counts = new Map<number, number>();
    commits.forEach((commit) => {
      const day = new Date(commit.date).getUTCDay();
      counts.set(day, (counts.get(day) ?? 0) + 1);
    });

    return [0, 1, 2, 3, 4, 5, 6].map((index) => ({
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index],
      count: counts.get(index) ?? 0,
    }));
  }, [commits]);

  const peakHourData = useMemo(() => {
    const counts = new Map<number, number>();
    if (analytics?.commits?.commit_frequency_by_hour) {
      Object.entries(analytics.commits.commit_frequency_by_hour).forEach(([hour, count]) => {
        counts.set(Number(hour), Number(count));
      });
    } else {
      commits.forEach((commit) => {
        const hour = new Date(commit.date).getUTCHours();
        counts.set(hour, (counts.get(hour) ?? 0) + 1);
      });
    }

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      count: counts.get(hour) ?? 0,
    }));
  }, [analytics?.commits?.commit_frequency_by_hour, commits]);

  const languageData = useMemo(() => {
    if (languageBreakdown.length > 0) {
      return languageBreakdown;
    }

    return repositories.slice(0, 5).map((repo) => ({
      name: repo.language,
      value: repo.commits || 1,
      percentage: repositories.length ? Math.round((repo.commits / Math.max(1, commits.length)) * 100) : 0,
    }));
  }, [commits.length, languageBreakdown, repositories]);

  const averageScore = Math.round(prScoreAverage * 100);
  const todayKey = toUtcDayKey(new Date());
  const todayRepoCount = new Set(commits.filter((commit) => toUtcDayKey(new Date(commit.date)) === todayKey).map((commit) => commit.repo)).size;

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--bg-void)" }}>
        <p style={{ color: "var(--text-dim)" }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardShell
      active="dashboard"
      title={`Welcome ${stats?.displayName || user.githubUsername}`}
      description="A live snapshot of your GitHub activity, streaks, and AI insights."
      username={user.githubUsername}
      avatarUrl={stats?.avatarUrl ?? null}
      syncing={syncing}
      onSync={syncNow}
    >
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <StreakCounter
              currentStreak={streaks.currentStreak}
              longestStreak={streaks.longestStreak}
              lastCommitDate={streaks.lastCommitDate}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <QuickStat label="Today\'s commits" value={<AnimatedNumber value={todayCommitCount} />} hint={`${todayRepoCount} repositories touched today`} />
              <QuickStat label="Average PR score" value={averageScore ? `${averageScore}/100` : "--"} hint="AI review quality across recent PRs" />
              <QuickStat label="Total commits" value={<AnimatedNumber value={stats?.commits ?? commits.length} />} hint="Synced from GitHub" />
              <QuickStat label="Repositories" value={<AnimatedNumber value={stats?.repositories ?? repositories.length} />} hint="Tracked repos in your workspace" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CommitFrequencyChart data={weekdayData} />
              <LanguageDonutChart data={languageData} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <PeakHourChart data={peakHourData} />
              <ActivityHeatmap commits={commits.map((commit) => ({ date: commit.date, count: 1 }))} />
            </div>

            <PRScoreList pullRequests={pullRequests} />

            <div className="grid gap-6 lg:grid-cols-2">
              <DigestPreviewCard content={digest?.content} weekStart={digest?.weekStart} />
              <div className="card p-5 sm:p-6">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Live</p>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Realtime Feed</h3>
                </div>
                <ActivityFeed maxItems={8} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <MostActiveRepos repos={repositories} />
              <RecentCommits commits={commits} />
            </div>
          </div>
        </div>
    </DashboardShell>
  );
}
