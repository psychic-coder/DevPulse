import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { useDashboardData } from "../../hooks/useDashboardData";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { user, loading, syncing, stats, syncNow, lastSyncedAt } = useDashboardData();
  const [locale, setLocale] = useState("en");
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, router, user]);

  useEffect(() => {
    const savedLocale = localStorage.getItem("devpulse.locale");
    const savedAutoSync = localStorage.getItem("devpulse.autoSync");
    if (savedLocale) setLocale(savedLocale);
    if (savedAutoSync !== null) setAutoSync(savedAutoSync === "true");
  }, []);

  if (loading || !user) return null;

  return (
    <DashboardShell active="settings" title="Settings" description="Control locale, sync habits, and profile preferences." username={user.githubUsername} syncing={syncing} onSync={syncNow} lastSyncedAt={lastSyncedAt}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Profile</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{stats?.displayName || user.githubUsername}</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.24em] mb-2" style={{ color: "var(--text-dim)" }}>Locale</label>
            <select
              className="w-full rounded-xl px-4 py-3 bg-transparent outline-none"
              style={{ border: "1px solid rgba(99,179,237,0.16)", color: "var(--text-primary)" }}
              value={locale}
              onChange={(event) => {
                const value = event.target.value;
                setLocale(value);
                localStorage.setItem("devpulse.locale", value);
              }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border p-4" style={{ borderColor: "rgba(99,179,237,0.12)" }}>
            <div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>Auto sync</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Remember your preference between sessions.</p>
            </div>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(event) => {
                const value = event.target.checked;
                setAutoSync(value);
                localStorage.setItem("devpulse.autoSync", String(value));
              }}
            />
          </div>
        </section>

        <section className="card p-5 sm:p-6 space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Sync settings</h3>
          <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            Trigger a manual sync whenever you want fresh commits, pull requests, and analytics. The dashboard will reflect the newest backend data once the sync completes.
          </p>
          <button className="btn-primary" onClick={syncNow} disabled={syncing}>
            {syncing ? "Syncing..." : "Run sync now"}
          </button>
        </section>
      </div>
    </DashboardShell>
  );
}
