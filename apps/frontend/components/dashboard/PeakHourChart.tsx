import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PeakHourChart({ data }: { data: Array<{ hour: string; count: number }> }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Tempo</p>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Peak Coding Hour</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} stroke="#8fa3bf" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#8fa3bf" />
            <Tooltip
              contentStyle={{
                background: "#0d1320",
                border: "1px solid rgba(99,179,237,0.18)",
                borderRadius: 12,
                color: "#e8f0fe",
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
