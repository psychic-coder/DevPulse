import { useMemo } from "react";

interface CommitItem {
  sha?: string;
  date?: string; // ISO date string
  committedAt?: string;
}

export function ContributionGraph({
  commits = [],
}: {
  commits?: CommitItem[];
}) {
  const weeks = 52;
  const days = 7;

  // Compute contribution counts for the last 52 weeks (364 days)
  const { grid, maxCount } = useMemo(() => {
    // Normalize commits into a map keyed by YYYY-MM-DD
    const counts: Record<string, number> = {};

    const now = new Date();
    // Start date is 52 weeks ago (oldest day)
    const totalDays = weeks * days; // 364
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    startDate.setUTCDate(startDate.getUTCDate() - (totalDays - 1));

    const toDateKey = (d: Date) => {
      return d.toISOString().slice(0, 10);
    };

    for (const c of commits || []) {
      const raw = c.date || c.committedAt || '';
      if (!raw) continue;
      const d = new Date(raw);
      if (isNaN(d.getTime())) continue;
      // Only count if within range
      if (d < startDate) continue;
      const key = toDateKey(d);
      counts[key] = (counts[key] || 0) + 1;
    }

    // Build grid as weeks x days with date and count
    const grid: { date: string; count: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const dt = new Date(startDate);
      dt.setUTCDate(startDate.getUTCDate() + i);
      const key = toDateKey(dt);
      grid.push({ date: key, count: counts[key] || 0 });
    }

    const maxCount = Math.max(0, ...grid.map((g) => g.count));
    return { grid, maxCount };
  }, [commits]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-800/30";
    if (count <= Math.max(1, Math.floor(maxCount * 0.15))) return "bg-green-900/40";
    if (count <= Math.max(2, Math.floor(maxCount * 0.35))) return "bg-green-700/60";
    if (count <= Math.max(4, Math.floor(maxCount * 0.75))) return "bg-green-500/70";
    return "bg-green-400/80";
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
        Contribution Graph (52 weeks)
      </h3>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-1 min-w-min">
          {Array.from({ length: weeks }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {Array.from({ length: days }).map((_, dayIdx) => {
                const idx = weekIdx * days + dayIdx;
                const cell = grid[idx] || { date: '', count: 0 };
                return (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-3 h-3 rounded-sm ${getColor(cell.count)} transition-colors cursor-pointer hover:ring-1 hover:ring-blue-400`}
                    title={`${cell.count} contributions on ${cell.date}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs mt-4" style={{ color: 'var(--text-dim)' }}>
        Darker = More contributions
      </p>
    </div>
  );
}
