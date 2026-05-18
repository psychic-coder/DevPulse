export function StreakCounter({
  currentStreak = 0,
  longestStreak = 0,
  lastCommitDate = null as string | null,
}: {
  currentStreak?: number;
  longestStreak?: number;
  lastCommitDate?: string | null;
}) {
  const isStreakAlive = lastCommitDate
    ? new Date().getTime() - new Date(lastCommitDate).getTime() < 86400000
    : false;

  return (
    <div
      className="rounded-xl p-6 grid grid-cols-2 gap-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(99,179,237,0.08)",
      }}
    >
      <div>
        <p
          className="text-sm font-medium mb-2"
          style={{ color: "var(--text-dim)" }}
        >
          Current Streak
        </p>
        <div className="flex items-baseline gap-2">
          <p
            className="text-3xl font-bold"
            style={{
              color: isStreakAlive ? "#4ade80" : "var(--text-secondary)",
            }}
          >
            {currentStreak}
          </p>
          <span style={{ color: "var(--text-dim)" }}>days</span>
        </div>
        {isStreakAlive && (
          <div
            className="mt-2 inline-block w-2 h-2 rounded-full"
            style={{ background: "#4ade80" }}
          />
        )}
      </div>

      <div>
        <p
          className="text-sm font-medium mb-2"
          style={{ color: "var(--text-dim)" }}
        >
          Longest Streak
        </p>
        <p
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {longestStreak}
        </p>
        <span
          className="text-xs"
          style={{ color: "var(--text-dim)" }}
        >
          days
        </span>
      </div>
    </div>
  );
}
