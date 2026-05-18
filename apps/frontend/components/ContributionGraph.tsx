import { motion } from "framer-motion";
import { useMemo } from "react";

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

  // Use useMemo to ensure consistent data between server and client
  const generatedData = useMemo(() => {
    // Generate deterministic mock data based on week/day index
    const result: Record<number, number> = {};
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < days; d++) {
        const key = w * 7 + d;
        // Use deterministic pattern instead of Math.random()
        result[key] = (key % 7) * 3 + (key % 5);
      }
    }
    return result;
  }, []);

  const maxCount = Math.max(...Object.values(generatedData));

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-800/30";
    if (count < 5) return "bg-green-900/40";
    if (count < 10) return "bg-green-700/60";
    if (count < 20) return "bg-green-500/70";
    return "bg-green-400/80";
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
                const key = weekIdx * 7 + dayIdx;
                const contribution = generatedData[key] || 0;
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
