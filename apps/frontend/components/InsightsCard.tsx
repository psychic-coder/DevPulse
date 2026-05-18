interface Insight {
  title: string;
  value: string;
  description: string;
  icon: string;
}

export function InsightsCard({
  insights = [],
}: {
  insights?: Insight[];
}) {
  const defaultInsights: Insight[] = [
    {
      title: "Peak Hour",
      value: "2 PM",
      description: "You code most between 2-3 PM",
      icon: "🕐",
    },
    {
      title: "Most Productive Day",
      value: "Wednesday",
      description: "Average 18 commits on Wednesdays",
      icon: "📅",
    },
    {
      title: "Avg Commits/Day",
      value: "8.3",
      description: "You commit 8-9 times daily",
      icon: "💾",
    },
    {
      title: "Favorite Language",
      value: "TypeScript",
      description: "45% of your code is TypeScript",
      icon: "📝",
    },
  ];

  const data = insights.length > 0 ? insights : defaultInsights;

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(99,179,237,0.08)",
      }}
    >
      <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
        Your Insights
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {data.map((insight, idx) => (
          <div
            key={insight.title}
            className="rounded-lg p-4 group hover:bg-blue-500/5 transition-colors"
            style={{
              background: "rgba(99,179,237,0.03)",
            }}
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
              {insight.icon}
            </div>
            <p
              className="text-xs font-medium mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              {insight.title}
            </p>
            <p
              className="text-lg font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {insight.value}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-dim)" }}
            >
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
