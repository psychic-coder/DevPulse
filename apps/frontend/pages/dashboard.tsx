"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import ActivityFeed from "../components/ActivityFeed";
import { ContributionGraph } from "../components/ContributionGraph";
import { StreakCounter } from "../components/StreakCounter";
import { LanguageChart } from "../components/LanguageChart";
import { RecentCommits } from "../components/RecentCommits";
import { PRStatusSummary } from "../components/PRStatusSummary";
import { MostActiveRepos } from "../components/MostActiveRepos";
import { InsightsCard } from "../components/InsightsCard";
import { SyncStatus } from "../components/SyncStatus";
import { useAuth } from "../context/AuthContext";

interface UserStats {
  id: string;
  githubUsername: string;
  displayName: string;
  repositories: number;
  commits: number;
  pullRequests: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(99,179,237,0.08)",
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-dim)" }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { fetchWithAuth, user } = useAuth();

  // Load user stats
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    fetchWithAuth(`/users/${user.id}`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to load stats:", err))
      .finally(() => setLoading(false));
  }, [user?.id, fetchWithAuth]);

  // Trigger sync
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetchWithAuth("/sync/github", {
        method: "POST",
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Sync completed:", result);
        // Refresh stats
        if (user?.id) {
          const statsResponse = await fetchWithAuth(`/users/${user.id}`);
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen relative"
        style={{ background: "var(--bg-void)" }}
      >
        {/* Background grid */}
        <div className="grid-bg" />

        {/* Hero top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="h-px flex-1 max-w-[40px]"
                      style={{
                        background:
                          "linear-gradient(90deg, #3b82f6, transparent)",
                      }}
                    />
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{
                        color: "var(--text-dim)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      Dashboard
                    </span>
                  </div>

                  <h1
                    className="font-bold"
                    style={{
                      fontSize: "clamp(2rem, 8vw, 3.5rem)",
                      letterSpacing: "-0.04em",
                      background:
                        "linear-gradient(135deg, #e8f0fe 0%, #93c5fd 40%, #c4b5fd 80%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Welcome {stats?.displayName || "Developer"}
                  </h1>

                  <p
                    className="text-base mt-4 max-w-md"
                    style={{
                      color: "var(--text-secondary)",
                      lineHeight: "1.7",
                    }}
                  >
                    Track your GitHub activity in real-time with live updates
                  </p>
                </div>

                {/* Sync Button */}
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-6 py-3 rounded-lg font-medium text-white transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    opacity: syncing ? 0.5 : 1,
                    cursor: syncing ? "not-allowed" : "pointer",
                  }}
                >
                  {syncing ? "Syncing..." : "Sync GitHub"}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="mb-12 text-center">
              <p style={{ color: "var(--text-dim)" }}>Loading stats...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <StatCard
                icon={
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.835l.74 4.435a1 1 0 01-.54 1.06l-1.896.566c.54 1.694 1.844 3.148 3.6 4.01l1.414-1.414a1 1 0 011.414 0l2.828 2.829a1 1 0 010 1.414l-2.83 2.828a1 1 0 01-1.414 0l-2.828-2.828a1 1 0 010-1.414l1.414-1.414C5.046 13.805 3.777 12.707 3.071 11.07l-1.896.566a1 1 0 01-1.06-.54l-.74-4.435A1 1 0 012 3z" />
                  </svg>
                }
                label="Repositories"
                value={stats.repositories}
                color="bg-blue-500/10"
              />
              <StatCard
                icon={
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM2 8a2 2 0 11-4 0 2 2 0 014 0zM18 15v2H0v-2a4 4 0 018-4h4a4 4 0 018 4z" />
                  </svg>
                }
                label="Commits"
                value={stats.commits}
                color="bg-green-500/10"
              />
              <StatCard
                icon={
                  <svg
                    className="w-6 h-6 text-purple-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                label="Pull Requests"
                value={stats.pullRequests}
                color="bg-purple-500/10"
              />
            </div>
          ) : null}

          {/* Main content grid */}
          <div className="space-y-8">
            {/* Section 1: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StreakCounter currentStreak={12} longestStreak={45} />
              <PRStatusSummary />
            </div>

            {/* Section 2: Insights & Sync */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InsightsCard />
              <SyncStatus
                info={{
                  lastSync: new Date().toISOString(),
                  nextScheduled: new Date(Date.now() + 21600000).toISOString(),
                  status: "synced",
                  itemsCount: 237,
                }}
              />
            </div>

            {/* Section 3: Charts & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContributionGraph />
              <LanguageChart />
            </div>

            {/* Section 4: Repositories & Commits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MostActiveRepos />
              <RecentCommits />
            </div>

            {/* Section 5: Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ActivityFeed maxItems={15} />
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
