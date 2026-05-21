import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DashboardShell } from "../../../../components/dashboard/DashboardShell";
import { useAuth } from "../../../../context/AuthContext";
import { useDashboardData } from "../../../../hooks/useDashboardData";

type RepoDetailData = {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  lastCommitAt: string;
  licenseType: string | null;
  htmlUrl: string;
  ncfScore: {
    total: number;
    goodFirstIssue: number;
    helpWanted: number;
    contributingFile: number;
    issueResponseTime: number;
    newContribPR: number;
    readmeQuality: number;
    codeOfConduct: number;
    prMergeRate: number;
  };
  healthFlags: {
    isArchived: boolean;
    isStale: boolean;
    noContributing: boolean;
    noReadme: boolean;
    lowPRMergeRate: boolean;
    forkHeavy: boolean;
    noExternalContribs: boolean;
    lowIssueEngagement: boolean;
    slowMaintainerResp: boolean;
  };
  contributors: Array<{ login: string; avatarUrl: string; contributions: number }>;
  recentPRs: Array<{ id: number; title: string; url: string; author: string; authorAvatar: string; mergedAt: string }>;
  savedId: string | null;
  notes: string | null;
  status: "saved" | "contributed" | "skipped" | null;
};

export default function OsFinderRepoDetailPage() {
  const router = useRouter();
  const { owner, repo } = router.query as { owner?: string; repo?: string };
  const { fetchWithAuth } = useAuth();
  const { user, loading: dashboardLoading } = useDashboardData();

  // Detail & Issues state
  const [detail, setDetail] = useState<RepoDetailData | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Watchlist Local settings State
  const [isSaved, setIsSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"saved" | "contributed" | "skipped">("saved");
  const [updatingWatchlist, setUpdatingWatchlist] = useState(false);

  useEffect(() => {
    if (!dashboardLoading && !user) {
      router.replace("/");
    }
  }, [dashboardLoading, router, user]);

  useEffect(() => {
    if (user && owner && repo) {
      loadDetails();
      loadIssues();
    }
  }, [user, owner, repo]);

  const loadDetails = async () => {
    setLoadingDetail(true);
    try {
      const res = await fetchWithAuth(`/os-finder/repo/${owner}/${repo}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
        setIsSaved(!!data.savedId);
        setNotes(data.notes || "");
        setStatus(data.status || "saved");
      } else {
        console.error("Failed to load repo details");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadIssues = async () => {
    setLoadingIssues(true);
    try {
      const res = await fetchWithAuth(`/os-finder/repo/${owner}/${repo}/issues`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data || []);
      }
    } catch (err) {
      console.error("Failed to load repo issues:", err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleWatchlistSave = async () => {
    if (!detail) return;
    setUpdatingWatchlist(true);

    try {
      if (isSaved) {
        // Update details (status + notes)
        const savedListRes = await fetchWithAuth("/os-finder/saved");
        if (savedListRes.ok) {
          const savedList = await savedListRes.json();
          const match = savedList.find((s: any) => Number(s.githubRepoId) === detail.githubRepoId);
          if (match) {
            const updRes = await fetchWithAuth(`/os-finder/saved/${match.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notes, status }),
            });
            if (updRes.ok) {
              alert("Watchlist updated successfully.");
            }
          }
        }
      } else {
        // Save new item
        const saveDto = {
          githubRepoId: detail.githubRepoId,
          owner: detail.owner,
          name: detail.name,
          fullName: detail.fullName,
          description: detail.description,
          language: detail.language,
          stars: detail.stars,
          forks: detail.forks,
          openIssues: detail.openIssues,
          ncfScore: detail.ncfScore,
          langMatchScore: 1.0,
          lastCommitAt: detail.lastCommitAt,
          hasContributing: !detail.healthFlags.noContributing,
          licenseType: detail.licenseType,
          htmlUrl: detail.htmlUrl,
          notes,
          status,
        };

        const saveRes = await fetchWithAuth("/os-finder/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveDto),
        });

        if (saveRes.ok) {
          setIsSaved(true);
          alert("Repository added to Watchlist.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingWatchlist(false);
    }
  };

  const handleWatchlistRemove = async () => {
    if (!detail) return;
    if (!confirm("Are you sure you want to remove this repo from your watchlist?")) return;

    setUpdatingWatchlist(true);
    try {
      const savedListRes = await fetchWithAuth("/os-finder/saved");
      if (savedListRes.ok) {
        const savedList = await savedListRes.json();
        const match = savedList.find((s: any) => Number(s.githubRepoId) === detail.githubRepoId);
        if (match) {
          const delRes = await fetchWithAuth(`/os-finder/saved/${match.id}`, { method: "DELETE" });
          if (delRes.ok) {
            setIsSaved(false);
            setNotes("");
            alert("Removed from Watchlist.");
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingWatchlist(false);
    }
  };

  const getNcfColorClass = (score: number) => {
    if (score >= 7.5) return "text-emerald-400 bg-emerald-950/40 border-emerald-900/50";
    if (score >= 5.0) return "text-amber-400 bg-amber-950/40 border-amber-900/50";
    return "text-sky-400 bg-sky-950/40 border-sky-900/50";
  };

  const getNcfBarColor = (score: number) => {
    if (score >= 7.5) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
    if (score >= 5.0) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]";
    return "bg-sky-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]";
  };

  if (dashboardLoading || !user) return null;

  return (
    <DashboardShell
      active="os-finder"
      title={detail ? detail.fullName : "Repository Details"}
      description="In-depth analysis of community health signals, NCF metrics, and onboarding items."
      username={user.githubUsername}
    >
      <div className="mb-6 border-b border-mid flex items-center justify-between pb-3">
        <Link href="/dashboard/os-finder" className="text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1.5 transition-all">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Discovery Engine
        </Link>

        {detail && (
          <a
            href={detail.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
          >
            <span>View on GitHub</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {loadingDetail || !detail ? (
        /* Loading skeleton */
        <div className="card p-10 animate-pulse text-center py-20">
          <div className="h-8 w-1/3 bg-hover rounded-md mx-auto mb-4" />
          <div className="h-4 w-1/2 bg-hover rounded-md mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-hover rounded-xl" />
            <div className="h-28 bg-hover rounded-xl" />
            <div className="h-28 bg-hover rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main info, NCF bars and health flags */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header info card */}
            <div className="card p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{detail.name}</h2>
                {detail.language && (
                  <span className="badge">{detail.language}</span>
                )}
                {detail.licenseType && (
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-dim px-2 py-0.5 rounded border border-dim">
                    {detail.licenseType}
                  </span>
                )}
              </div>

              <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                {detail.description || "No description provided."}
              </p>

              {/* Counter badges */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-dim text-center">
                <div className="p-3 bg-void rounded-xl border border-dim">
                  <span className="block text-xl font-bold text-amber-400">{detail.stars.toLocaleString()}</span>
                  <span className="text-[10px] text-dim uppercase tracking-wider">Stars</span>
                </div>
                <div className="p-3 bg-void rounded-xl border border-dim">
                  <span className="block text-xl font-bold text-blue-400">{detail.forks.toLocaleString()}</span>
                  <span className="text-[10px] text-dim uppercase tracking-wider">Forks</span>
                </div>
                <div className="p-3 bg-void rounded-xl border border-dim">
                  <span className="block text-xl font-bold text-emerald-400">{detail.openIssues.toLocaleString()}</span>
                  <span className="text-[10px] text-dim uppercase tracking-wider">Open Issues</span>
                </div>
              </div>
            </div>

            {/* NCF Score Breakdown Card */}
            <div className="card p-6 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-dim">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>New Contributor Friendliness (NCF)</h3>
                  <p className="text-xs text-dim mt-0.5">8 metrics representing maintainer responsiveness and code accessibility.</p>
                </div>
                <span className={`text-xl font-bold px-3 py-1.5 rounded-xl border shrink-0 ${getNcfColorClass(detail.ncfScore.total)}`}>
                  {Number(detail.ncfScore.total).toFixed(1)} / 10
                </span>
              </div>

              {/* NCF Bars grid */}
              <div className="space-y-4 pt-2">
                {/* Metric Item: Good First Issues */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">Good First Issues Label (25%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.goodFirstIssue} / 2.5</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.goodFirstIssue / 2.5) * 100}%` }} />
                  </div>
                </div>

                {/* Metric Item: Help Wanted */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">Help Wanted Label (10%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.helpWanted} / 1.0</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.helpWanted / 1.0) * 100}%` }} />
                  </div>
                </div>

                {/* Metric Item: Contributing Guide */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">CONTRIBUTING.md file present (15%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.contributingFile} / 1.5</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.contributingFile / 1.5) * 100}%` }} />
                  </div>
                </div>

                {/* Metric Item: Issue Response Time */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">Issue Closure Responsiveness (20%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.issueResponseTime} / 2.0</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.issueResponseTime / 2.0) * 100}%` }} />
                  </div>
                </div>

                {/* Metric Item: New Contributor PR */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">Recent Merged External PRs (15%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.newContribPR} / 1.5</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.newContribPR / 1.5) * 100}%` }} />
                  </div>
                </div>

                {/* Metric Item: Code of Conduct */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">Code of Conduct present (5%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.codeOfConduct} / 0.5</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.codeOfConduct / 0.5) * 100}%` }} />
                  </div>
                </div>

                {/* Metric Item: Readme Quality */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">README quality & detail (5%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.readmeQuality} / 0.5</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.readmeQuality / 0.5) * 100}%` }} />
                  </div>
                </div>

                {/* Metric Item: PR Merge Rate */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary font-medium">Pull Request Merge Rate (5%)</span>
                    <span className="text-primary font-semibold">{detail.ncfScore.prMergeRate} / 0.5</span>
                  </div>
                  <div className="h-2 w-full bg-void rounded-full overflow-hidden border border-dim">
                    <div className={`h-full rounded-full ${getNcfBarColor(detail.ncfScore.total)}`} style={{ width: `${(detail.ncfScore.prMergeRate / 0.5) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Beginner Issues list section */}
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Open Onboarding Issues</h3>
              <p className="text-xs text-dim -mt-2">Active tickets marked with good-first-issue or help-wanted labels.</p>

              {loadingIssues ? (
                <div className="space-y-2 animate-pulse pt-2">
                  <div className="h-10 bg-hover rounded-md" />
                  <div className="h-10 bg-hover rounded-md" />
                </div>
              ) : issues.length === 0 ? (
                <div className="p-6 bg-void text-center border border-dim rounded-xl text-secondary text-sm">
                  No issues matching new contributor labels were found.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {issues.map(issue => (
                    <a
                      key={issue.id}
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-void border border-dim hover:border-mid hover:bg-hover transition-all flex justify-between items-center"
                    >
                      <div className="space-y-1 truncate max-w-[80%]">
                        <span className="text-xs text-dim font-mono">#{issue.number}</span>
                        <h4 className="text-sm font-semibold text-secondary hover:text-blue-400 transition-colors truncate">
                          {issue.title}
                        </h4>
                        <div className="flex gap-1.5 flex-wrap">
                          {issue.labels?.map((l: string) => (
                            <span key={l} className="px-1.5 py-0.5 rounded bg-blue-950/20 text-blue-400 border border-blue-900/50 text-[9px] font-semibold">{l}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-dim shrink-0">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{issue.commentsCount || 0}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: Watchlist panel, Community profile details, PR lists */}
          <div className="lg:col-span-4 space-y-6">
            {/* Watchlist Manager Panel */}
            <div className="card p-5 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-dim font-bold">Watchlist Settings</h3>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-dim block mb-1">Status</span>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="bg-void text-xs border border-dim rounded-xl px-2 py-2 text-secondary focus:outline-none w-full cursor-pointer hover:border-mid"
                  >
                    <option value="saved">Saved</option>
                    <option value="contributed">Contributed</option>
                    <option value="skipped">Skipped</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-dim block mb-1">Contribution Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full text-xs rounded-xl p-2.5 bg-void border border-dim text-secondary focus:outline-none focus:border-glow resize-none placeholder-dim"
                    placeholder="e.g. Setting up dev container environment, fix issue #43 next week..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleWatchlistSave}
                    disabled={updatingWatchlist}
                    className="btn-primary flex-1 justify-center py-2 text-xs"
                  >
                    {isSaved ? "Save Notes" : "Add to Watchlist"}
                  </button>
                  {isSaved && (
                    <button
                      onClick={handleWatchlistRemove}
                      disabled={updatingWatchlist}
                      className="p-2 border border-dim hover:border-rose-900/50 hover:bg-rose-950/20 text-dim hover:text-rose-400 rounded-xl transition-all bg-void"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Health Signals */}
            <div className="card p-5 space-y-3.5">
              <h3 className="text-xs uppercase tracking-widest text-dim font-bold">Health Warning Flags</h3>
              <div className="space-y-2 text-xs">
                {/* archived */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Archived Project</span>
                  {detail.healthFlags.isArchived ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50 font-semibold font-mono text-[9px]">WARNING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* stale */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Stale Activity (&gt;180d)</span>
                  {detail.healthFlags.isStale ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50 font-semibold font-mono text-[9px]">WARNING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* no readme */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Missing README</span>
                  {detail.healthFlags.noReadme ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/50 font-semibold font-mono text-[9px]">MISSING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* no contributing */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Missing CONTRIBUTING</span>
                  {detail.healthFlags.noContributing ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/50 font-semibold font-mono text-[9px]">MISSING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* low merge */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Low PR Merge Rate (&lt;30%)</span>
                  {detail.healthFlags.lowPRMergeRate ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50 font-semibold font-mono text-[9px]">WARNING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* fork heavy */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Fork Heavy (&gt;5 forks per star)</span>
                  {detail.healthFlags.forkHeavy ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50 font-semibold font-mono text-[9px]">WARNING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* low external contribs */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Core Maintainer Dominance</span>
                  {detail.healthFlags.noExternalContribs ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/50 font-semibold font-mono text-[9px]">YES</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* low issue engagement */}
                <div className="flex justify-between items-center py-1 border-b border-dim">
                  <span className="text-secondary">Unreplied Issues</span>
                  {detail.healthFlags.lowIssueEngagement ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50 font-semibold font-mono text-[9px]">WARNING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
                {/* slow maintainer response */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-secondary">Slow maintainer reply (&gt;14d)</span>
                  {detail.healthFlags.slowMaintainerResp ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50 font-semibold font-mono text-[9px]">WARNING</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            {detail.contributors.length > 0 && (
              <div className="card p-5 space-y-3">
                <h3 className="text-xs uppercase tracking-widest text-dim font-bold">Top Contributors</h3>
                <div className="space-y-3">
                  {detail.contributors.map(c => (
                    <div key={c.login} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <img src={c.avatarUrl} alt={c.login} className="h-6 w-6 rounded-full border border-dim shrink-0" />
                        <span className="text-xs text-secondary font-medium">{c.login}</span>
                      </div>
                      <span className="text-[10px] text-dim font-mono">{c.contributions} commits</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Merged PRs */}
            {detail.recentPRs.length > 0 && (
              <div className="card p-5 space-y-3">
                <h3 className="text-xs uppercase tracking-widest text-dim font-bold">Recent Merged PRs</h3>
                <div className="space-y-3">
                  {detail.recentPRs.map(pr => (
                    <a
                      key={pr.id}
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-hover p-1.5 rounded-lg transition-all"
                    >
                      <h4 className="text-xs text-secondary font-semibold truncate hover:text-blue-400 transition-colors">
                        {pr.title}
                      </h4>
                      <div className="flex justify-between items-center mt-1 text-[10px] text-dim">
                        <span className="flex items-center gap-1">
                          <img src={pr.authorAvatar} className="h-4 w-4 rounded-full" />
                          {pr.author}
                        </span>
                        <span>{new Date(pr.mergedAt).toLocaleDateString()}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
