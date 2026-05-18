import { useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { DigestPreviewCard } from "../../components/dashboard/DigestPreviewCard";
import { useDashboardData } from "../../hooks/useDashboardData";

export default function DashboardDigestPage() {
  const router = useRouter();
  const { user, loading, syncing, digest, syncNow } = useDashboardData();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, router, user]);

  if (loading || !user) return null;

  return (
    <DashboardShell active="digest" title="Weekly Digest" description="A readable summary of your week, generated from synced GitHub activity." username={user.githubUsername} syncing={syncing} onSync={syncNow}>
      <div className="space-y-6">
        <DigestPreviewCard content={digest?.content} weekStart={digest?.weekStart} />
        <section className="card p-5 sm:p-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Digest Notes</h3>
          <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            The backend stores each digest with raw stats so you can render richer summaries later, compare weeks, or export the result into email and notifications.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
