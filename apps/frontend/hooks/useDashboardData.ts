import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

type UserStats = {
  id: string;
  githubUsername: string;
  displayName: string;
  avatarUrl?: string | null;
  repositories: number;
  commits: number;
  pullRequests: number;
};

export type DashboardCommit = {
  sha: string;
  message: string;
  author: string;
  date: string;
  repo: string;
  url?: string;
  additions?: number;
  deletions?: number;
};

export type DashboardRepository = {
  name: string;
  commits: number;
  prs: number;
  stars: number;
  language: string;
  url: string;
};

export type DashboardPR = {
  id: string;
  title: string;
  state: "open" | "closed" | "merged";
  repo: string;
  created_at: string;
  url?: string;
  prScore?: number | null;
  prScoreReason?: string | null;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
};

export type DashboardDigest = {
  id?: string;
  content?: string;
  weekStart?: string;
  createdAt?: string;
  rawStats?: Record<string, unknown>;
};

export type DashboardAnalytics = {
  commits?: {
    peak_hour?: number;
    peak_day?: string;
    avg_daily_commits?: number;
    longest_streak_days?: number;
    current_streak_days?: number;
    total_additions?: number;
    total_deletions?: number;
    commit_frequency_by_hour?: Record<string, number>;
    commit_frequency_by_day?: Record<string, number>;
  };
  languages?: {
    distribution?: Record<string, number>;
    stats?: Record<string, { percentage?: number; bytes?: number }>;
    top_languages?: Array<{ name?: string; language?: string; percentage?: number; color?: string; bytes?: number }>;
    diversity?: {
      total_languages?: number;
      primary_language?: string | null;
      primary_percentage?: number;
      is_polyglot?: boolean;
    };
  };
  lastUpdated?: string;
};

type Streaks = {
  currentStreak: number;
  longestStreak: number;
  lastCommitDate: string | null;
};

type DashboardDataState = {
  loading: boolean;
  syncing: boolean;
  stats: UserStats | null;
  repositories: DashboardRepository[];
  commits: DashboardCommit[];
  pullRequests: DashboardPR[];
  streaks: Streaks;
  analytics: DashboardAnalytics | null;
  digest: DashboardDigest | null;
};

const defaultStreaks: Streaks = {
  currentStreak: 0,
  longestStreak: 0,
  lastCommitDate: null,
};

function toJson<T>(response: Response): Promise<T> {
  return response.json();
}

function toUtcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function useDashboardData() {
  const { user, fetchWithAuth } = useAuth();
  const [state, setState] = useState<DashboardDataState>({
    loading: true,
    syncing: false,
    stats: null,
    repositories: [],
    commits: [],
    pullRequests: [],
    streaks: defaultStreaks,
    analytics: null,
    digest: null,
  });

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    setState((current) => ({ ...current, loading: true }));

    try {
      const [statsResponse, syncResponse, streaksResponse, analyticsResponse, digestResponse] = await Promise.allSettled([
        fetchWithAuth(`/users/${user.id}`),
        fetchWithAuth("/sync/github"),
        fetchWithAuth("/sync/github/streaks"),
        fetchWithAuth("/analytics/me"),
        fetchWithAuth("/digests/me"),
      ]);

      const stats = statsResponse.status === "fulfilled" && statsResponse.value.ok
        ? await toJson<UserStats>(statsResponse.value)
        : null;

      const syncData = syncResponse.status === "fulfilled" && syncResponse.value.ok
        ? await toJson<any>(syncResponse.value)
        : null;

      const streakData = streaksResponse.status === "fulfilled" && streaksResponse.value.ok
        ? await toJson<Streaks>(streaksResponse.value)
        : defaultStreaks;

      const analyticsData = analyticsResponse.status === "fulfilled" && analyticsResponse.value.ok
        ? await toJson<DashboardAnalytics>(analyticsResponse.value)
        : null;

      const digestData = digestResponse.status === "fulfilled" && digestResponse.value.ok
        ? await toJson<DashboardDigest>(digestResponse.value)
        : null;

      const repositories = (syncData?.repositories ?? []).map((repo: any) => ({
        name: repo.name,
        commits: 0,
        prs: 0,
        stars: repo.stars ?? 0,
        language: repo.language || "Unknown",
        url: repo.url || repo.html_url || "#",
      }));

      const commits = (syncData?.commits ?? [])
        .slice()
        .sort((left: any, right: any) => new Date(right.committedAt ?? right.createdAt).getTime() - new Date(left.committedAt ?? left.createdAt).getTime())
        .map((commit: any) => ({
          sha: commit.sha,
          message: commit.message,
          author: commit.authorName || commit.author || "unknown",
          date: commit.committedAt || commit.createdAt,
          repo: commit.repository?.name || commit.repositoryName || "unknown",
          url: commit.url || "#",
          additions: commit.additions ?? 0,
          deletions: commit.deletions ?? 0,
        }));

      const repoCommitCounts = new Map<string, number>();
      commits.forEach((commit) => {
        repoCommitCounts.set(commit.repo, (repoCommitCounts.get(commit.repo) ?? 0) + 1);
      });

      const repoPrCounts = new Map<string, number>();
      const pullRequests = (syncData?.pullRequests ?? []).map((pr: any) => ({
        id: String(pr.id ?? pr.githubPrId ?? pr.github_pr_id),
        title: pr.title,
        state: (pr.state ?? "open") as "open" | "closed" | "merged",
        repo: pr.repository?.name || pr.repositoryName || "unknown",
        created_at: pr.createdAt || pr.created_at || new Date().toISOString(),
        url: pr.url || pr.html_url || "#",
        prScore: pr.prScore ?? pr.pr_score ?? null,
        prScoreReason: pr.prScoreReason ?? pr.pr_score_reason ?? null,
        additions: pr.additions ?? 0,
        deletions: pr.deletions ?? 0,
        changedFiles: pr.changedFiles ?? pr.changed_files ?? 0,
      }));

      pullRequests.forEach((pr) => {
        repoPrCounts.set(pr.repo, (repoPrCounts.get(pr.repo) ?? 0) + 1);
      });

      const mappedRepositories = repositories.map((repo) => ({
        ...repo,
        commits: repoCommitCounts.get(repo.name) ?? 0,
        prs: repoPrCounts.get(repo.name) ?? 0,
      }));

      setState({
        loading: false,
        syncing: false,
        stats,
        repositories: mappedRepositories,
        commits,
        pullRequests,
        streaks: streakData,
        analytics: analyticsData,
        digest: digestData,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setState((current) => ({ ...current, loading: false, syncing: false }));
    }
  }, [fetchWithAuth, user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const syncNow = useCallback(async () => {
    if (!user?.id) return;

    setState((current) => ({ ...current, syncing: true }));
    try {
      const response = await fetchWithAuth("/sync/github", { method: "POST" });
      if (!response.ok) {
        throw new Error("Sync failed");
      }
      await loadDashboard();
    } finally {
      setState((current) => ({ ...current, syncing: false }));
    }
  }, [fetchWithAuth, loadDashboard, user?.id]);

  const todayCommitCount = useMemo(() => {
    const today = toUtcDayKey(new Date());
    return state.commits.filter((commit) => toUtcDayKey(new Date(commit.date)) === today).length;
  }, [state.commits]);

  const prScoreAverage = useMemo(() => {
    const scores = state.pullRequests.map((pr) => pr.prScore).filter((score): score is number => typeof score === "number");
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [state.pullRequests]);

  const languageBreakdown = useMemo(() => {
    const aggregate = new Map<string, number>();
    state.repositories.forEach((repo) => {
      if (!repo.language) return;
      aggregate.set(repo.language, (aggregate.get(repo.language) ?? 0) + 1);
    });

    return Array.from(aggregate.entries())
      .map(([name, count]) => ({
        name,
        value: count,
        percentage: state.repositories.length ? Math.round((count / state.repositories.length) * 100) : 0,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [state.repositories]);

  return {
    ...state,
    user,
    todayCommitCount,
    prScoreAverage,
    languageBreakdown,
    loadDashboard,
    syncNow,
  };
}
