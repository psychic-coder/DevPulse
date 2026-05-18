import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type LanguageDatum = { name: string; value: number; percentage: number };

const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b"];

export function LanguageDonutChart({ data }: { data: LanguageDatum[] }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Stack</p>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Language Distribution</h3>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px,1fr] items-center">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0d1320",
                  border: "1px solid rgba(99,179,237,0.18)",
                  borderRadius: 12,
                  color: "#e8f0fe",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ background: colors[index % colors.length] }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {item.name}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-dim)" }}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(99,179,237,0.08)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ background: colors[index % colors.length], width: `${item.percentage}%` }}
                      />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
  );
}
