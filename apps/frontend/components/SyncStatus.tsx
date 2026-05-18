interface SyncInfo {
  lastSync: string | null;
  nextScheduled: string | null;
  status: "synced" | "syncing" | "failed" | "pending";
  itemsCount?: number;
}

export function SyncStatus({
  info = {
    lastSync: null,
    nextScheduled: null,
    status: "synced",
  },
}: {
  info?: SyncInfo;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return { bg: "bg-green-500/20", text: "text-green-400", dot: "#4ade80" };
      case "syncing":
        return { bg: "bg-blue-500/20", text: "text-blue-400", dot: "#3b82f6" };
      case "failed":
        return { bg: "bg-red-500/20", text: "text-red-400", dot: "#ef4444" };
      case "pending":
        return { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "#fbbf24" };
      default:
        return { bg: "bg-gray-500/20", text: "text-gray-400", dot: "#6b7280" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "synced":
        return "Last sync successful";
      case "syncing":
        return "Currently syncing...";
      case "failed":
        return "Sync failed";
      case "pending":
        return "Waiting to sync";
      default:
        return "Unknown status";
    }
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const colors = getStatusColor(info.status);

  return (
    <div
      className={`rounded-xl p-6 ${colors.bg}`}
      style={{
        background: "rgba(99,179,237,0.03)",
        border: "1px solid rgba(99,179,237,0.08)",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: colors.dot }}
            />
            <span
              className={`text-sm font-semibold ${colors.text}`}
            >
              {getStatusLabel(info.status)}
            </span>
          </div>
          <h3
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Sync Status
          </h3>
        </div>
        <span className="text-2xl">🔄</span>
      </div>

      <div className="space-y-3">
        <div className="pt-3 border-t" style={{ borderColor: "rgba(99,179,237,0.08)" }}>
          <div className="flex justify-between items-center">
            <span
              className="text-sm"
              style={{ color: "var(--text-dim)" }}
            >
              Last Sync
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {getTimeAgo(info.lastSync)}
            </span>
          </div>
        </div>

        {info.nextScheduled && (
          <div className="pt-3 border-t" style={{ borderColor: "rgba(99,179,237,0.08)" }}>
            <div className="flex justify-between items-center">
              <span
                className="text-sm"
                style={{ color: "var(--text-dim)" }}
              >
                Next Sync
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {getTimeAgo(info.nextScheduled)}
              </span>
            </div>
          </div>
        )}

        {info.itemsCount && (
          <div className="pt-3 border-t" style={{ borderColor: "rgba(99,179,237,0.08)" }}>
            <div className="flex justify-between items-center">
              <span
                className="text-sm"
                style={{ color: "var(--text-dim)" }}
              >
                Items Synced
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {info.itemsCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
