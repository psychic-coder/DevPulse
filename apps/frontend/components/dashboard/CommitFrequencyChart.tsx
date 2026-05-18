import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DayDatum = { day: string; count: number };

export function CommitFrequencyChart({ data }: { data: DayDatum[] }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-end justify-between mb-4 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Rhythm</p>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Commit Frequency</h3>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#8fa3bf" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#8fa3bf" />
            <Tooltip
              cursor={{ fill: "rgba(59,130,246,0.08)" }}
              contentStyle={{
                background: "#0d1320",
                border: "1px solid rgba(99,179,237,0.18)",
                borderRadius: 12,
                color: "#e8f0fe",
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
