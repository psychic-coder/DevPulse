import { motion } from "framer-motion";

interface PRStats {
  open: number;
  closed: number;
  merged: number;
  draft: number;
}

export function PRStatusSummary({
  stats = { open: 0, closed: 0, merged: 0, draft: 0 },
}: {
  stats?: PRStats;
}) {
  const defaultStats = { open: 12, closed: 45, merged: 89, draft: 3 };
  const data = stats.open > 0 || stats.closed > 0 ? stats : defaultStats;

  const total = data.open + data.closed + data.merged + data.draft;
  const statCards = [
    {
      label: "Open",
      value: data.open,
      color: "#3b82f6",
      bgColor: "bg-blue-500/10",
      icon: "📂",
    },
    {
      label: "Merged",
      value: data.merged,
      color: "#8b5cf6",
      bgColor: "bg-purple-500/10",
      icon: "✅",
    },
    {
      label: "Closed",
      value: data.closed,
      color: "#ef4444",
      bgColor: "bg-red-500/10",
      icon: "❌",
    },
    {
      label: "Draft",
      value: data.draft,
      color: "#6b7280",
      bgColor: "bg-gray-500/10",
      icon: "📝",
    },
  ];

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
      <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
        Pull Requests
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-lg p-3 ${stat.bgColor} text-center`}
          >
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p
              className="text-xs font-medium mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              {stat.label}
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t" style={{ borderColor: "rgba(99,179,237,0.08)" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--text-dim)" }}>
            Total PRs
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {total}
          </span>
        </div>
        <motion.div
          className="h-2 rounded-full mt-3 overflow-hidden"
          style={{ background: "rgba(99,179,237,0.1)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444, #6b7280)",
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
