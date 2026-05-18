import { motion } from "framer-motion";

interface ContributionDay {
  date: string;
  count: number;
}

export function ContributionGraph({
  data = [],
}: {
  data?: ContributionDay[];
}) {
  const weeks = 52;
  const days = 7;
  const maxCount = Math.max(...(data?.map((d) => d.count) || [1]));

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-800/30";
    if (count < 5) return "bg-green-900/40";
    if (count < 10) return "bg-green-700/50";
    if (count < 20) return "bg-green-500/60";
    return "bg-green-400/70";
  };

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
        Contribution Graph (52 weeks)
      </h3>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-1 min-w-min">
          {Array.from({ length: weeks }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {Array.from({ length: days }).map((_, dayIdx) => {
                const dayOfYear = weekIdx * 7 + dayIdx;
                const contribution =
                  data?.find(
                    (d) =>
                      new Date(d.date).getTime() ===
                      new Date(
                        new Date().getFullYear(),
                        0,
                        dayOfYear
                      ).getTime()
                  )?.count || Math.floor(Math.random() * 25);
                return (
                  <motion.div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-3 h-3 rounded-sm ${getColor(contribution)} transition-colors cursor-pointer hover:ring-1 hover:ring-blue-400`}
                    title={`${contribution} contributions`}
                    whileHover={{ scale: 1.2 }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p
        className="text-xs mt-4"
        style={{ color: "var(--text-dim)" }}
      >
        Darker = More contributions
      </p>
    </motion.div>
  );
}
