import React from 'react';
import {
  useActivityFeed,
  ActivityEvent,
  CommitEvent,
  PREvent,
  SyncStartedEvent,
  SyncCompleteEvent,
} from '../hooks/useActivityFeed';

interface ActivityFeedProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  className = '',
  showHeader = true,
  maxItems = 10,
}) => {
  const { events, isConnected, isLoading, clearEvents } = useActivityFeed({
    maxEvents: maxItems,
  });

  const renderCommitEvent = (event: CommitEvent) => {
    const shortSha = event.sha.substring(0, 7);
    const shortMessage =
      event.message.length > 50
        ? event.message.substring(0, 50) + '...'
        : event.message;

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <svg
                className="h-4 w-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM2 8a2 2 0 11-4 0 2 2 0 014 0zM18 15v2H0v-2a4 4 0 018-4h4a4 4 0 018 4z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              New Commit
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                {shortSha}
              </code>{' '}
              in <span className="font-medium">{event.repo}</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              {shortMessage}
            </p>
            {(event.additions || event.deletions) && (
              <div className="flex gap-2 mt-2 text-xs">
                {event.additions && (
                  <span className="text-green-600 dark:text-green-400">
                    +{event.additions}
                  </span>
                )}
                {event.deletions && (
                  <span className="text-red-600 dark:text-red-400">
                    -{event.deletions}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPREvent = (event: PREvent) => {
    const stateColors = {
      open: 'bg-green-50 dark:bg-green-900/20 border-green-500',
      closed: 'bg-red-50 dark:bg-red-900/20 border-red-500',
      merged: 'bg-purple-50 dark:bg-purple-900/20 border-purple-500',
    };

    return (
      <div className={`border-l-4 p-4 ${stateColors[event.state]}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                event.state === 'open'
                  ? 'bg-green-500'
                  : event.state === 'merged'
                    ? 'bg-purple-500'
                    : 'bg-red-500'
              }`}
            >
              <svg
                className="h-4 w-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Pull Request
              </p>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  event.state === 'open'
                    ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : event.state === 'merged'
                      ? 'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {event.state}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              in <span className="font-medium">{event.repo}</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              {event.title}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSyncStartedEvent = () => {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500">
              <svg
                className="h-4 w-4 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              GitHub Sync Started
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Syncing your repositories, commits, and pull requests...
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSyncCompleteEvent = (event: SyncCompleteEvent) => {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <svg
                className="h-4 w-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              GitHub Sync Complete
            </p>
            <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
              {event.newCommits !== undefined && (
                <span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {event.newCommits}
                  </span>{' '}
                  new commit{event.newCommits !== 1 ? 's' : ''}
                </span>
              )}
              {event.newPRs !== undefined && (
                <span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {event.newPRs}
                  </span>{' '}
                  new PR{event.newPRs !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEvent = (event: ActivityEvent) => {
    switch (event.type) {
      case 'commit':
        return renderCommitEvent(event as CommitEvent);
      case 'pr':
        return renderPREvent(event as PREvent);
      case 'sync_started':
        return renderSyncStartedEvent();
      case 'sync_complete':
        return renderSyncCompleteEvent(event as SyncCompleteEvent);
      default:
        return null;
    }
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Feed
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? 'bg-green-500'
                    : isLoading
                      ? 'bg-amber-500'
                      : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isConnected
                  ? 'Connected'
                  : isLoading
                    ? 'Connecting...'
                    : 'Disconnected'}
              </span>
            </div>
            {events.length > 0 && (
              <button
                onClick={clearEvents}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading
              ? 'Connecting to realtime feed...'
              : isConnected
                ? 'No activity yet. Trigger a GitHub sync to see events!'
                : 'Not connected. Check your internet connection.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.slice(0, maxItems).map((event, index) => (
            <div key={`${event.type}-${index}`}>
              {renderEvent(event)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
