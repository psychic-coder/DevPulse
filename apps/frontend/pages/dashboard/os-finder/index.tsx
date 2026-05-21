import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "../../../components/dashboard/DashboardShell";

const MotionDiv = motion.div as any;
import { useAuth } from "../../../context/AuthContext";
import { useDashboardData } from "../../../hooks/useDashboardData";
import type {
  OsFinderFilters,
  OsFinderRepoResult,
  OsFinderSearchResponse,
} from "../../../../../packages/shared-types/os-finder.types";

const POPULAR_LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Ruby", "C++", "Java", "HTML", "CSS"
];

const DOMAINS = [
  { value: "web", label: "Web & Fullstack" },
  { value: "devtools", label: "Developer Tools & CLIs" },
  { value: "ai_ml", label: "AI & Machine Learning" },
  { value: "mobile", label: "Mobile Apps" },
  { value: "data", label: "Data Science & DBs" },
  { value: "infrastructure", label: "DevOps & Cloud" },
  { value: "education", label: "Education & Tutorials" },
  { value: "games", label: "Game Dev" },
  { value: "finance", label: "Fintech & Crypto" },
];

export default function OsFinderSearchPage() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();
  const { user, loading: dashboardLoading } = useDashboardData();

  // Mode Selection
  const [aiMode, setAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState("");

  // Search Results & State
  const [searching, setSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<OsFinderSearchResponse | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Watchlist Save/Status Notes Local state
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedNotes, setSavedNotes] = useState<Record<number, string>>({});

  // Manual Filters State
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [languageMode, setLanguageMode] = useState<"strict" | "any_of">("any_of");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [repoSize, setRepoSize] = useState<"small" | "medium" | "large" | "any">("any");
  const [lastCommitDays, setLastCommitDays] = useState(90);
  const [minOpenIssues, setMinOpenIssues] = useState(3);
  const [issueFreshDays, setIssueFreshDays] = useState(60);
  const [hasContributing, setHasContributing] = useState(true);
  const [hasCodeOfConduct, setHasCodeOfConduct] = useState(false);
  const [includeAlreadyContributed, setIncludeAlreadyContributed] = useState(false);
  const [prMergeRate, setPrMergeRate] = useState(30);

  // Authenticate user check
  useEffect(() => {
    if (!dashboardLoading && !user) {
      router.replace("/");
    }
  }, [dashboardLoading, router, user]);

  // Load history and default filters
  useEffect(() => {
    if (user) {
      loadSearchHistory();
      // Default to user's top languages if they are set on the backend
      fetchWithAuth("/os-finder/search?limit=1").then(async (res) => {
        if (res.ok) {
          const data: OsFinderSearchResponse = await res.json();
          if (data.filtersApplied && data.filtersApplied.languages) {
            setSelectedLanguages(data.filtersApplied.languages);
          }
        }
      }).catch(err => console.error(err));
    }
  }, [user]);

  const loadSearchHistory = async () => {
    try {
      const res = await fetchWithAuth("/os-finder/history");
      if (res.ok) {
        const historyData = await res.json();
        setSearchHistory(historyData || []);
      }
    } catch (err) {
      console.error("Failed to load search history:", err);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleDomainToggle = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  const executeSearch = async (e?: React.FormEvent, customFilters?: OsFinderFilters) => {
    if (e) e.preventDefault();
    setSearching(true);

    try {
      let res;
      if (aiMode && !customFilters) {
        res = await fetchWithAuth("/os-finder/search/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: aiQuery }),
        });
      } else {
        const filters = customFilters || {
          languages: selectedLanguages,
          languageMode,
          difficulty,
          domains: selectedDomains as any[],
          repoSize,
          lastCommitDays,
          minOpenIssues,
          issueFreshDays,
          hasContributing,
          hasCodeOfConduct,
          includeAlreadyContributed,
          prMergeRate,
          licenseTypes: [],
        };

        const queryParams = new URLSearchParams();
        if (filters.languages?.length) queryParams.set("languages", filters.languages.join(","));
        if (filters.languageMode) queryParams.set("languageMode", filters.languageMode);
        if (filters.difficulty) queryParams.set("difficulty", filters.difficulty);
        if (filters.domains?.length) queryParams.set("domains", filters.domains.join(","));
        if (filters.repoSize) queryParams.set("repoSize", filters.repoSize);
        queryParams.set("lastCommitDays", String(filters.lastCommitDays));
        queryParams.set("minOpenIssues", String(filters.minOpenIssues));
        queryParams.set("issueFreshDays", String(filters.issueFreshDays));
        queryParams.set("hasContributing", String(filters.hasContributing));
        queryParams.set("hasCodeOfConduct", String(filters.hasCodeOfConduct));
        queryParams.set("includeAlreadyContributed", String(filters.includeAlreadyContributed));
        queryParams.set("prMergeRate", String(filters.prMergeRate));

        res = await fetchWithAuth(`/os-finder/search?${queryParams.toString()}`);
      }

      if (res.ok) {
        const data: OsFinderSearchResponse = await res.json();
        setSearchResponse(data);
        loadSearchHistory();
      } else {
        const errorText = await res.text();
        alert(`Search failed: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while executing search.");
    } finally {
      setSearching(false);
    }
  };

  const applyHistoryItem = (historyItem: any) => {
    const filters = historyItem.filtersApplied as OsFinderFilters;
    if (filters) {
      setSelectedLanguages(filters.languages || []);
      setLanguageMode(filters.languageMode || "any_of");
      setDifficulty(filters.difficulty || "beginner");
      setSelectedDomains(filters.domains || []);
      setRepoSize(filters.repoSize || "any");
      setLastCommitDays(filters.lastCommitDays || 90);
      setMinOpenIssues(filters.minOpenIssues || 3);
      setIssueFreshDays(filters.issueFreshDays || 60);
      setHasContributing(filters.hasContributing ?? true);
      setHasCodeOfConduct(filters.hasCodeOfConduct ?? false);
      setIncludeAlreadyContributed(filters.includeAlreadyContributed ?? false);
      setPrMergeRate(filters.prMergeRate || 30);
    }

    if (historyItem.aiQueryUsed) {
      setAiMode(true);
      setAiQuery(historyItem.queryText || "");
      executeSearch(undefined, filters);
    } else {
      setAiMode(false);
      executeSearch(undefined, filters);
    }
  };

  const toggleWatchlist = async (repo: OsFinderRepoResult) => {
    setSavingId(repo.githubRepoId);
    try {
      if (repo.isSaved) {
        // Find saved item ID
        const savedListRes = await fetchWithAuth("/os-finder/saved");
        if (savedListRes.ok) {
          const savedList = await savedListRes.json();
          const match = savedList.find((s: any) => Number(s.githubRepoId) === repo.githubRepoId);
          if (match) {
            const delRes = await fetchWithAuth(`/os-finder/saved/${match.id}`, { method: "DELETE" });
            if (delRes.ok) {
              setSearchResponse(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  results: prev.results.map(r =>
                    r.githubRepoId === repo.githubRepoId ? { ...r, isSaved: false } : r
                  ),
                };
              });
            }
          }
        }
      } else {
        // Save
        const saveDto = {
          githubRepoId: repo.githubRepoId,
          owner: repo.owner,
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          language: repo.language,
          stars: repo.stars,
          forks: repo.forks,
          openIssues: repo.openIssues,
          ncfScore: repo.ncfScore,
          langMatchScore: repo.langMatchScore,
          lastCommitAt: repo.lastCommitAt,
          hasContributing: !repo.healthFlags.noContributing,
          licenseType: repo.licenseType,
          htmlUrl: repo.htmlUrl,
          notes: savedNotes[repo.githubRepoId] || "",
          status: "saved",
        };

        const saveRes = await fetchWithAuth("/os-finder/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveDto),
        });

        if (saveRes.ok) {
          setSearchResponse(prev => {
            if (!prev) return null;
            return {
              ...prev,
              results: prev.results.map(r =>
                r.githubRepoId === repo.githubRepoId ? { ...r, isSaved: true } : r
              ),
            };
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const updateWatchlistStatus = async (repo: OsFinderRepoResult, status: "saved" | "contributed" | "skipped") => {
    try {
      const savedListRes = await fetchWithAuth("/os-finder/saved");
      if (savedListRes.ok) {
        const savedList = await savedListRes.json();
        const match = savedList.find((s: any) => Number(s.githubRepoId) === repo.githubRepoId);
        if (match) {
          await fetchWithAuth(`/os-finder/saved/${match.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotesChange = async (repoId: number, notes: string) => {
    setSavedNotes(prev => ({ ...prev, [repoId]: notes }));
    try {
      const savedListRes = await fetchWithAuth("/os-finder/saved");
      if (savedListRes.ok) {
        const savedList = await savedListRes.json();
        const match = savedList.find((s: any) => Number(s.githubRepoId) === repoId);
        if (match) {
          await fetchWithAuth(`/os-finder/saved/${match.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to color code NCF Score
  const getNcfColorClass = (score: number) => {
    if (score >= 7.5) return "text-emerald-400 bg-emerald-950/40 border-emerald-900/50";
    if (score >= 5.0) return "text-amber-400 bg-amber-950/40 border-amber-900/50";
    return "text-sky-400 bg-sky-950/40 border-sky-900/50";
  };

  if (dashboardLoading || !user) return null;

  return (
    <DashboardShell
      active="os-finder"
      title="Open Source Finder"
      description="Personalized contribution engine. Matching skills to beginner-friendly community repositories."
      username={user.githubUsername}
    >
      <div className="mb-6 border-b border-mid flex items-center justify-between pb-3">
        <div className="flex gap-4">
          <Link href="/dashboard/os-finder" className="text-sm font-semibold border-b-2 border-blue-500 pb-3 -mb-[14px]" style={{ color: "var(--text-primary)" }}>
            Discovery Engine
          </Link>
          <Link href="/dashboard/os-finder/saved" className="text-sm font-semibold pb-3 -mb-[14px]" style={{ color: "var(--text-secondary)" }}>
            My Watchlist
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Left: Filters */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-5 space-y-6">
            {/* Search mode toggler */}
            <div className="flex bg-void p-1 rounded-xl border border-dim">
              <button
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${!aiMode ? "bg-hover text-white shadow-sm" : "text-dim"}`}
                onClick={() => setAiMode(false)}
              >
                Standard Filters
              </button>
              <button
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${aiMode ? "bg-hover text-white shadow-sm" : "text-dim"}`}
                onClick={() => setAiMode(true)}
              >
                AI Co-Pilot Search
              </button>
            </div>

            {aiMode ? (
              /* AI Mode input */
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-dim block mb-2">What are you looking to build?</label>
                  <textarea
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    rows={4}
                    className="w-full text-sm rounded-xl p-3 bg-void border border-dim text-primary focus:outline-none focus:border-glow resize-none placeholder-dim"
                    placeholder="e.g. beginner friendly CLI devtools in typescript..."
                  />
                </div>
                <button
                  onClick={executeSearch}
                  disabled={searching || !aiQuery.trim()}
                  className="btn-primary w-full justify-center"
                >
                  {searching ? "AI analyzing..." : "Run AI Search"}
                </button>
              </div>
            ) : (
              /* Manual Filters */
              <form onSubmit={executeSearch} className="space-y-5">
                {/* Languages */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs uppercase tracking-widest text-dim">Languages</label>
                    <select
                      value={languageMode}
                      onChange={(e: any) => setLanguageMode(e.target.value)}
                      className="bg-void text-xs border border-dim rounded px-1.5 py-0.5 text-secondary focus:outline-none"
                    >
                      <option value="any_of">Match Any</option>
                      <option value="strict">Match All</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {POPULAR_LANGUAGES.map(lang => {
                      const selected = selectedLanguages.includes(lang.toLowerCase());
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleLanguageToggle(lang.toLowerCase())}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                            selected
                              ? "bg-blue-950/40 text-blue-300 border-blue-800/80"
                              : "bg-void text-secondary border-dim hover:border-mid"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-dim block mb-2">Target Level</label>
                  <div className="grid grid-cols-3 gap-2 bg-void p-1 rounded-xl border border-dim">
                    {(["beginner", "intermediate", "advanced"] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`capitalize py-1.5 text-xs font-medium rounded-lg transition-all ${
                          difficulty === lvl ? "bg-hover text-white shadow-xs" : "text-dim"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Repo Size Selector */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-dim block mb-2">Repository Size</label>
                  <div className="grid grid-cols-4 gap-1.5 bg-void p-1 rounded-xl border border-dim">
                    {(["any", "small", "medium", "large"] as const).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setRepoSize(size)}
                        className={`capitalize py-1 text-[10px] font-medium rounded-md transition-all ${
                          repoSize === size ? "bg-hover text-white shadow-xs" : "text-dim"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Domain Toggles */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-dim block mb-2">Project Category / Domain</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOMAINS.map(dom => {
                      const selected = selectedDomains.includes(dom.value);
                      return (
                        <button
                          key={dom.value}
                          type="button"
                          onClick={() => handleDomainToggle(dom.value)}
                          className={`text-left text-xs p-2 rounded-xl border transition-all ${
                            selected
                              ? "bg-purple-950/40 text-purple-300 border-purple-800/80"
                              : "bg-void text-secondary border-dim hover:border-mid"
                          }`}
                        >
                          {dom.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-3 pt-2 border-t border-dim">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-dim">Last Commit (Max days ago)</span>
                      <span className="text-secondary">{lastCommitDays}d</span>
                    </div>
                    <input
                      type="range" min="15" max="365" step="15"
                      value={lastCommitDays}
                      onChange={(e) => setLastCommitDays(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-dim">Min Open Issues</span>
                      <span className="text-secondary">{minOpenIssues}</span>
                    </div>
                    <input
                      type="range" min="0" max="30" step="1"
                      value={minOpenIssues}
                      onChange={(e) => setMinOpenIssues(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-dim">Issue Freshness (Max days)</span>
                      <span className="text-secondary">{issueFreshDays}d</span>
                    </div>
                    <input
                      type="range" min="15" max="180" step="15"
                      value={issueFreshDays}
                      onChange={(e) => setIssueFreshDays(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-dim">Min PR Merge Rate</span>
                      <span className="text-secondary">{prMergeRate}%</span>
                    </div>
                    <input
                      type="range" min="0" max="80" step="5"
                      value={prMergeRate}
                      onChange={(e) => setPrMergeRate(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-dim text-xs text-secondary">
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox" checked={hasContributing}
                      onChange={(e) => setHasContributing(e.target.checked)}
                      className="rounded border-dim accent-blue-500 bg-void"
                    />
                    Requires CONTRIBUTING.md file
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox" checked={hasCodeOfConduct}
                      onChange={(e) => setHasCodeOfConduct(e.target.checked)}
                      className="rounded border-dim accent-blue-500 bg-void"
                    />
                    Requires Code of Conduct
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox" checked={includeAlreadyContributed}
                      onChange={(e) => setIncludeAlreadyContributed(e.target.checked)}
                      className="rounded border-dim accent-blue-500 bg-void"
                    />
                    Include already contributed repos
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={searching}
                  className="btn-primary w-full justify-center mt-3"
                >
                  {searching ? "Finding repositories..." : "Search Repositories"}
                </button>
              </form>
            )}
          </div>

          {/* Search History Card */}
          {searchHistory.length > 0 && (
            <div className="card p-5">
              <h4 className="text-xs uppercase tracking-widest text-dim mb-3">Recent Searches</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {searchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => applyHistoryItem(item)}
                    className="w-full text-left p-2.5 rounded-lg bg-void border border-dim text-xs hover:border-mid hover:bg-hover transition-all flex items-center justify-between text-secondary hover:text-primary"
                  >
                    <span className="truncate max-w-[200px]">
                      {item.aiQueryUsed ? `🤖 "${item.queryText}"` : `🔍 ${item.filtersApplied?.languages?.join(", ") || "Any"} (${item.filtersApplied?.difficulty})`}
                    </span>
                    <span className="text-[10px] text-dim whitespace-nowrap">
                      {item.resultCount} hits
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Results List */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {searching ? (
              /* Loading Screen Skeletons */
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-5 animate-pulse space-y-4">
                    <div className="flex justify-between">
                      <div className="h-6 w-1/3 bg-hover rounded-md" />
                      <div className="h-6 w-16 bg-hover rounded-md" />
                    </div>
                    <div className="h-4 w-5/6 bg-hover rounded-md" />
                    <div className="flex gap-4 pt-2">
                      <div className="h-4 w-12 bg-hover rounded-md" />
                      <div className="h-4 w-12 bg-hover rounded-md" />
                      <div className="h-4 w-12 bg-hover rounded-md" />
                    </div>
                  </div>
                ))}
              </MotionDiv>
            ) : searchResponse?.results ? (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Relaxation warning notice */}
                {searchResponse.relaxationNote && (
                  <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 text-amber-300 text-xs flex gap-3 items-center shadow-lg">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{searchResponse.relaxationNote}</span>
                  </div>
                )}

                {/* Results count info bar */}
                <div className="flex justify-between items-center text-sm px-1 text-secondary">
                  <span>
                    Found <strong className="text-primary">{searchResponse.total}</strong> match{searchResponse.total !== 1 ? "es" : ""}
                  </span>
                  {searchResponse.aiModeUsed && (
                    <span className="badge">AI Assisted</span>
                  )}
                </div>

                {searchResponse.results.length === 0 ? (
                  <div className="card p-10 text-center space-y-4">
                    <p className="text-secondary text-sm">No repositories found matching your filter criteria.</p>
                    <p className="text-dim text-xs">Try relaxing your filters, widening the star limit, or adding more languages.</p>
                  </div>
                ) : (
                  /* Cards List */
                  searchResponse.results.map((repo, idx) => (
                    <MotionDiv
                      key={repo.githubRepoId}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="card p-5 flex flex-col md:flex-row justify-between gap-6 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                    >
                      {/* Left Block details */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/dashboard/os-finder/${repo.owner}/${repo.name}`} className="text-lg font-bold hover:text-blue-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                            {repo.fullName}
                          </Link>
                          {repo.language && (
                            <span className="badge">{repo.language}</span>
                          )}
                          {repo.alreadyContrib && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold border border-purple-800/80 bg-purple-950/40 text-purple-400 rounded-md">Contributed</span>
                          )}
                        </div>

                        <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                          {repo.description || "No description provided."}
                        </p>

                        {/* Badges footer */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-dim">
                          <span className="flex items-center gap-1.5 text-secondary">
                            <svg className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {repo.stars.toLocaleString()} stars
                          </span>

                          <span className="flex items-center gap-1.5 text-secondary">
                            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.908-1.963m0 0a3 3 0 114.243 4.243l-4.908 1.963m0 0l-4.908-1.963m0 0a3 3 0 114.243-4.243L8.684 10.742z" />
                            </svg>
                            {repo.forks.toLocaleString()} forks
                          </span>

                          <span className="flex items-center gap-1.5 text-secondary">
                            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {repo.openIssues.toLocaleString()} open issues
                          </span>

                          <span>
                            Updated {new Date(repo.lastCommitAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Right Block Score, Details Link, watchlist controls */}
                      <div className="flex md:flex-col justify-between items-end md:items-end gap-3 shrink-0">
                        {/* NCF Score */}
                        <div className="text-right">
                          <span className="text-[10px] text-dim uppercase tracking-wider block mb-1">NCF Score</span>
                          <span className={`text-base font-bold px-3 py-1.5 rounded-xl border ${getNcfColorClass(repo.ncfScore?.total || 0)}`}>
                            {(repo.ncfScore?.total || 0).toFixed(1)} / 10
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex md:flex-col gap-2 w-full md:w-auto">
                          <Link href={`/dashboard/os-finder/${repo.owner}/${repo.name}`} className="btn-ghost text-xs justify-center">
                            View Details
                          </Link>
                          <button
                            onClick={() => toggleWatchlist(repo)}
                            disabled={savingId === repo.githubRepoId}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 justify-center ${
                              repo.isSaved
                                ? "bg-amber-950/20 text-amber-300 border-amber-900/50 hover:bg-amber-900/30"
                                : "bg-hover text-secondary border-dim hover:text-white"
                            }`}
                          >
                            <svg className="h-4 w-4" fill={repo.isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            {repo.isSaved ? "Saved" : "Save"}
                          </button>
                        </div>
                      </div>
                    </MotionDiv>
                  ))
                )}
              </MotionDiv>
            ) : (
              /* Initial state welcome dashboard instructions */
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card p-8 text-center space-y-6 max-w-2xl mx-auto py-12"
              >
                <div className="h-16 w-16 mx-auto rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))", border: "1px solid rgba(99,179,237,0.15)" }}>
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Find Your Next Open Source Contribution</h3>
                  <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    Configure the language and level sliders on the left or use our AI Co-Pilot Search. We'll crawl GitHub search indices and score candidate repositories based on new-contributor friendliness, activity, and response times.
                  </p>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardShell>
  );
}
