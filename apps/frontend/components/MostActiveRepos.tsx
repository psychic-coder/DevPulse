import { motion } from "framer-motion";

interface Repo {
  name: string;
  commits: number;
  prs: number;
  stars: number;
  language: string;
  url?: string;
}

export function MostActiveRepos({
  repos = [],
}: {
  repos?: Repo[];
}) {
  const defaultRepos: Repo[] = [
    {
      name: "DevPulse",
      commits: 156,
      prs: 24,
      stars: 342,
      language: "TypeScript",
      url: "#",
    },
    {
      name: "React-UI-Kit",
      commits: 98,
      prs: 15,
      stars: 523,
      language: "JavaScript",
      url: "#",
    },
    {
      name: "API-Server",
      commits: 87,
      prs: 12,
      stars: 128,
      language: "Node.js",
      url: "#",
    },
  ];

  const data = repos.length > 0 ? repos : defaultRepos;
  const sorted = [...data].sort((a, b) => b.commits - a.commits);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(99,179,237,0.08)",
      }}
    >
      <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Most Active Repositories
      </h3>

      <div className="space-y-3">
        {sorted.map((repo, idx) => (
          <motion.a
            key={repo.name}
            href={repo.url || "#"}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="block p-3 rounded-lg transition-all hover:bg-blue-500/5"
            style={{
              background: "rgba(99,179,237,0.03)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <h4
                  className="font-medium text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {repo.name}
                </h4>
              </div>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  background: "rgba(99,179,237,0.2)",
                  color: "var(--text-secondary)",
                }}
              >
                {repo.language}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span>💾</span>
                <span style={{ color: "var(--text-dim)" }}>
                  {repo.commits} commits
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>🔀</span>
                <span style={{ color: "var(--text-dim)" }}>
                  {repo.prs} PRs
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span style={{ color: "var(--text-dim)" }}>
                  {repo.stars} stars
                </span>
              </div>
            </div>

            <motion.div
              className="h-1.5 rounded-full mt-2 overflow-hidden"
              style={{ background: "rgba(99,179,237,0.1)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(repo.commits / (sorted[0]?.commits || 100)) * 100}%`,
                }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="h-full"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6, #06b6d4)",
                }}
              />
            </motion.div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
