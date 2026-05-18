import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Navbar } from "../Navbar";

type RouteKey = "dashboard" | "commits" | "prs" | "digest" | "settings";

const tabs: Array<{ key: RouteKey; label: string; href: string }> = [
  { key: "dashboard", label: "Overview", href: "/dashboard" },
  { key: "commits", label: "Commits", href: "/dashboard/commits" },
  { key: "prs", label: "PRs", href: "/dashboard/prs" },
  { key: "digest", label: "Digest", href: "/dashboard/digest" },
  { key: "settings", label: "Settings", href: "/dashboard/settings" },
];

export function DashboardShell({
  active,
  title,
  description,
  username,
  avatarUrl,
  syncing,
  onSync,
  children,
}: {
  active: RouteKey;
  title: string;
  description: string;
  username?: string | null;
  avatarUrl?: string | null;
  syncing?: boolean;
  onSync?: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
    <main className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-void)" }}>
      <div className="grid-bg" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 72% 50% at 50% 0%, rgba(59,130,246,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="sticky top-0 z-40 mb-6 rounded-2xl border backdrop-blur-xl"
          style={{ background: "rgba(8,12,18,0.8)", borderColor: "rgba(99,179,237,0.10)" }}>
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(99,179,237,0.18)" }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username ?? "avatar"} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-bold text-sm" style={{ color: "#93c5fd" }}>
                    {(username ?? "DP").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Dashboard</p>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{description}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const activeTab = tab.key === active;
                  return (
                    <Link
                      key={tab.key}
                      href={tab.href}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: activeTab ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.02)",
                        color: activeTab ? "#dbeafe" : "var(--text-secondary)",
                        border: "1px solid rgba(99,179,237,0.12)",
                      }}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>

              {onSync ? (
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="btn-primary justify-center"
                  style={{ opacity: syncing ? 0.6 : 1 }}
                >
                  {syncing ? "Syncing..." : "Sync GitHub"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {children}
        </motion.div>
      </div>
    </main>
    </>
  );
}
