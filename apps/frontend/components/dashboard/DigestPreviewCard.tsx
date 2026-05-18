import Link from "next/link";

export function DigestPreviewCard({ content, weekStart }: { content?: string; weekStart?: string }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-dim)" }}>Weekly digest</p>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Preview</h3>
        </div>
        <Link href="/dashboard/digest" className="text-sm font-medium text-blue-300">
          Open full view
        </Link>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(99,179,237,0.12)", background: "rgba(255,255,255,0.02)" }}>
        <p className="text-sm leading-7 whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
          {content || "No digest is available yet. Run a sync to generate the weekly summary."}
        </p>
      </div>

      {weekStart ? (
        <p className="mt-3 text-xs" style={{ color: "var(--text-dim)" }}>
          Week of {weekStart}
        </p>
      ) : null}
    </div>
  );
}
