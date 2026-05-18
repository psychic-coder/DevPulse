interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  repo: string;
  url?: string;
}

export function RecentCommits({
  commits = [],
}: {
  commits?: Commit[];
}) {
  const defaultCommits: Commit[] = [
    {
      sha: "a1b2c3d",
      message: "feat: Add real-time sync to dashboard",
      author: "John Doe",
      date: new Date(Date.now() - 3600000).toISOString(),
      repo: "DevPulse",
      url: "#",
    },
    {
      sha: "e4f5g6h",
      message: "fix: Resolve cookie persistence issue",
      author: "John Doe",
      date: new Date(Date.now() - 7200000).toISOString(),
      repo: "DevPulse",
      url: "#",
    },
    {
      sha: "i7j8k9l",
      message: "docs: Update API documentation",
      author: "Jane Smith",
      date: new Date(Date.now() - 86400000).toISOString(),
      repo: "React-UI",
      url: "#",
    },
  ];

  const data = commits.length > 0 ? commits : defaultCommits;
  const displayCommits = data.slice(0, 5);

  const getCommitTypeColor = (message: string) => {
    if (message.startsWith("feat")) return "bg-green-500/20 text-green-400";
    if (message.startsWith("fix")) return "bg-red-500/20 text-red-400";
    if (message.startsWith("docs")) return "bg-blue-500/20 text-blue-400";
    if (message.startsWith("style")) return "bg-purple-500/20 text-purple-400";
    if (message.startsWith("refactor")) return "bg-yellow-500/20 text-yellow-400";
    return "bg-gray-500/20 text-gray-400";
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(99,179,237,0.08)",
      }}
    >
      <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Recent Commits
      </h3>

      <div className="space-y-3">
        {displayCommits.map((commit, idx) => (
          <a
            key={commit.sha}
            href={commit.url || "#"}
            className="block p-3 rounded-lg transition-all hover:bg-blue-500/5"
            style={{
              background: "rgba(99,179,237,0.03)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${getCommitTypeColor(commit.message)}`}
                  >
                    {commit.message.split(":")[0].toUpperCase()}
                  </span>
                  <code
                    className="text-xs font-mono"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {commit.sha}
                  </code>
                </div>
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {commit.message}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {commit.author}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-dim)" }}
                  >
                    •
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {getTimeAgo(commit.date)}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-dim)" }}
                  >
                    •
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {commit.repo}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
