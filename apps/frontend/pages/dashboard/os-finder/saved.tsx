import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "../../../components/dashboard/DashboardShell";

const MotionDiv = motion.div as any;
import { useAuth } from "../../../context/AuthContext";
import { useDashboardData } from "../../../hooks/useDashboardData";

export default function OsFinderSavedPage() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();
  const { user, loading: dashboardLoading } = useDashboardData();

  // Watchlist Items
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);

  // Status Filter ("all", "saved", "contributed", "skipped")
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Notes update buffer state to prevent excessive API calls
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboardLoading && !user) {
      router.replace("/");
    }
  }, [dashboardLoading, router, user]);

  useEffect(() => {
    if (user) {
      loadWatchlist();
    }
  }, [user]);

  const loadWatchlist = async () => {
    setLoadingWatchlist(true);
    try {
      const res = await fetchWithAuth("/os-finder/saved");
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data || []);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    // Update local state first for instant response
    setWatchlist(prev =>
      prev.map(item => (item.id === itemId ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await fetchWithAuth(`/os-finder/saved/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        console.error("Failed to update status on server");
        loadWatchlist(); // rollback
      }
    } catch (err) {
      console.error("Error updating watchlist status:", err);
      loadWatchlist(); // rollback
    }
  };

  const handleNotesChange = async (itemId: string, notes: string) => {
    // Update local state
    setWatchlist(prev =>
      prev.map(item => (item.id === itemId ? { ...item, notes } : item))
    );

    setSavingNotesId(itemId);
    try {
      const res = await fetchWithAuth(`/os-finder/saved/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        console.error("Failed to update notes on server");
      }
    } catch (err) {
      console.error("Error updating notes:", err);
    } finally {
      setSavingNotesId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this repository from your watchlist?")) {
      return;
    }

    // Update local state first
    setWatchlist(prev => prev.filter(item => item.id !== itemId));

    try {
      const res = await fetchWithAuth(`/os-finder/saved/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Failed to remove item on server");
        loadWatchlist(); // rollback
      }
    } catch (err) {
      console.error("Error removing watchlist item:", err);
      loadWatchlist(); // rollback
    }
  };

  const filteredWatchlist = watchlist.filter(item => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  const getNcfColorClass = (score: number) => {
    if (score >= 7.5) return "text-emerald-400 bg-emerald-950/40 border-emerald-900/50";
    if (score >= 5.0) return "text-amber-400 bg-amber-950/40 border-amber-900/50";
    return "text-sky-400 bg-sky-950/40 border-sky-900/50";
  };

  if (dashboardLoading || !user) return null;

  return (
    <DashboardShell
      active="os-finder"
      title="OS Finder Watchlist"
      description="Track repositories you want to contribute to, monitor status, and maintain contribution notes."
      username={user.githubUsername}
    >
      <div className="mb-6 border-b border-mid flex items-center justify-between pb-3">
        <div className="flex gap-4">
          <Link href="/dashboard/os-finder" className="text-sm font-semibold pb-3 -mb-[14px]" style={{ color: "var(--text-secondary)" }}>
            Discovery Engine
          </Link>
          <Link href="/dashboard/os-finder/saved" className="text-sm font-semibold border-b-2 border-blue-500 pb-3 -mb-[14px]" style={{ color: "var(--text-primary)" }}>
            My Watchlist
          </Link>
        </div>

        {/* Watchlist status filters tabs */}
        <div className="flex bg-void p-0.5 rounded-lg border border-dim">
          {["all", "saved", "contributed", "skipped"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-semibold capitalize rounded-md transition-all ${
                statusFilter === status ? "bg-hover text-white" : "text-dim"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loadingWatchlist ? (
          /* Loading states */
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[1, 2].map(i => (
              <div key={i} className="card p-5 animate-pulse space-y-4">
                <div className="h-6 w-1/4 bg-hover rounded-md" />
                <div className="h-12 w-full bg-hover rounded-md" />
              </div>
            ))}
          </MotionDiv>
        ) : filteredWatchlist.length === 0 ? (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card p-10 text-center space-y-4 py-16"
          >
            <div className="h-14 w-14 mx-auto rounded-2xl flex items-center justify-center bg-void border border-dim">
              <svg className="h-7 w-7 text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Your Watchlist is empty</h4>
              <p className="text-xs text-dim mt-1 max-w-sm mx-auto leading-5">
                {statusFilter === "all"
                  ? "Go back to the Discovery Engine, search for repos, and click 'Save to Watchlist'."
                  : `No repositories marked as '${statusFilter}' found.`}
              </p>
            </div>
            {statusFilter === "all" && (
              <Link href="/dashboard/os-finder" className="btn-primary inline-flex mt-2 text-xs">
                Back to Discovery Search
              </Link>
            )}
          </MotionDiv>
        ) : (
          /* Watchlist results */
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredWatchlist.map((item) => (
              <MotionDiv
                key={item.id}
                layout
                className="card p-5 flex flex-col md:flex-row gap-6 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)]"
              >
                {/* Details left section */}
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/os-finder/${item.owner}/${item.name}`} className="text-lg font-bold hover:text-blue-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                      {item.fullName}
                    </Link>
                    {item.language && (
                      <span className="badge">{item.language}</span>
                    )}
                    {/* Status badge */}
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                      item.status === "contributed"
                        ? "bg-purple-950/40 text-purple-300 border-purple-900/50"
                        : item.status === "skipped"
                        ? "bg-rose-950/40 text-rose-300 border-rose-900/50"
                        : "bg-blue-950/40 text-blue-300 border-blue-900/50"
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {item.description || "No description provided."}
                  </p>

                  {/* Notes update section */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest text-dim font-semibold">Contribution Notes & Tasks</label>
                      {savingNotesId === item.id && (
                        <span className="text-[10px] text-blue-400 animate-pulse">Saving...</span>
                      )}
                    </div>
                    <textarea
                      value={item.notes || ""}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      rows={2}
                      className="w-full text-xs rounded-xl p-2.5 bg-void border border-dim text-secondary focus:outline-none focus:border-glow resize-none placeholder-dim"
                      placeholder="Add personal checklists, bugs to fix, or tasks here..."
                    />
                  </div>
                </div>

                {/* Status manager dropdown & NCF display */}
                <div className="flex md:flex-col justify-between items-end md:items-end gap-4 shrink-0 md:border-l border-dim md:pl-6">
                  {/* NCF score badge */}
                  <div className="text-right">
                    <span className="text-[10px] text-dim uppercase tracking-wider block mb-1">NCF Score</span>
                    {item.ncfScore?.total ? (
                      <span className={`text-sm font-bold px-2.5 py-1 rounded border ${getNcfColorClass(item.ncfScore.total)}`}>
                        {Number(item.ncfScore.total).toFixed(1)} / 10
                      </span>
                    ) : (
                      <span className="text-xs text-dim">N/A</span>
                    )}
                  </div>

                  {/* Watchlist controllers */}
                  <div className="space-y-2 w-full md:w-auto text-right">
                    <div>
                      <span className="text-[10px] text-dim uppercase tracking-wider block mb-1">Status</span>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="bg-void text-xs border border-dim rounded px-2 py-1.5 text-secondary focus:outline-none w-full md:w-32 cursor-pointer hover:border-mid"
                      >
                        <option value="saved">Saved</option>
                        <option value="contributed">Contributed</option>
                        <option value="skipped">Skipped</option>
                      </select>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <Link href={`/dashboard/os-finder/${item.owner}/${item.name}`} className="btn-ghost py-1 px-2.5 text-[10px] font-semibold justify-center">
                        Details
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-dim hover:text-rose-400 border border-dim hover:border-rose-900/40 rounded transition-all bg-void hover:bg-rose-950/20"
                        title="Remove from watchlist"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </MotionDiv>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
