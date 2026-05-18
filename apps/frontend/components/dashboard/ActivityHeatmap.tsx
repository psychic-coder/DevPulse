import { useMemo, useState } from "react";

type Commit = { date: string; count: number };

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function levelColor(count: number, max: number) {
  if (count === 0) return "rgba(148,163,184,0.08)";
  if (count <= Math.max(1, Math.floor(max * 0.2))) return "rgba(59,130,246,0.18)";
  if (count <= Math.max(2, Math.floor(max * 0.45))) return "rgba(59,130,246,0.32)";
  if (count <= Math.max(4, Math.floor(max * 0.75))) return "rgba(59,130,246,0.52)";
  return "rgba(59,130,246,0.82)";
}

export function ActivityHeatmap({ commits }: { commits: Commit[] }) {
  const [hovered, setHovered] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const { grid, max } = useMemo(() => {
    const counts = new Map<string, number>();
    commits.forEach((commit) => {
      const key = dayKey(new Date(commit.date));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const totalDays = 52 * 7;
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (totalDays - 1));

    const cells = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = dayKey(date);
      return { date: key, count: counts.get(key) ?? 0 };
    });

    return { grid: cells, max: Math.max(0, ...cells.map((cell) => cell.count)) };
  }, [commits]);

  return (
    <div className="card p-5 sm:p-6 relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>History</p>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Activity Heatmap</h3>
        </div>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>52 weeks</span>
      </div>

      <div className="relative overflow-x-auto pb-2">
        <div className="grid grid-flow-col gap-1 w-max">
          {Array.from({ length: 52 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const cell = grid[weekIndex * 7 + dayIndex];
                if (!cell) return null;

                return (
                  <button
                    key={`${cell.date}-${dayIndex}`}
                    onMouseEnter={(event) => setHovered({ date: cell.date, count: cell.count, x: event.clientX, y: event.clientY })}
                    onMouseLeave={() => setHovered(null)}
                    className="h-3.5 w-3.5 rounded-[3px]"
                    style={{ background: levelColor(cell.count, max), boxShadow: cell.count ? "0 0 0 1px rgba(255,255,255,0.04) inset" : "none" }}
                    aria-label={`${cell.count} commits on ${cell.date}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hovered ? (
        <div
          className="pointer-events-none fixed z-50 rounded-xl px-3 py-2 text-xs shadow-2xl"
          style={{
            left: hovered.x + 12,
            top: hovered.y + 12,
            background: "#0d1320",
            border: "1px solid rgba(99,179,237,0.18)",
            color: "#e8f0fe",
          }}
        >
          <div className="font-semibold">{hovered.count} commits</div>
          <div style={{ color: "#8fa3bf" }}>{hovered.date}</div>
        </div>
      ) : null}
    </div>
  );
}
