import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export interface CommitEvent {
  type: 'commit';
  sha: string;
  message: string;
  repo: string;
  committed_at: string;
  additions?: number;
  deletions?: number;
}

export interface PREvent {
  type: 'pr';
  id: string;
  title: string;
  state: 'open' | 'closed' | 'merged';
  repo: string;
  created_at: string;
  url?: string;
}

export interface SyncStartedEvent {
  type: 'sync_started';
  startedAt: string;
}

export interface SyncCompleteEvent {
  type: 'sync_complete';
  totalCommits: number;
  totalPRs: number;
  syncedAt: string;
  newCommits?: number;
  newPRs?: number;
}

export type ActivityEvent =
  | CommitEvent
  | PREvent
  | SyncStartedEvent
  | SyncCompleteEvent;

interface UseActivityFeedOptions {
  enabled?: boolean;
  maxEvents?: number;
  autoConnect?: boolean;
}

export const useActivityFeed = (options: UseActivityFeedOptions = {}) => {
  const {
    enabled = true,
    maxEvents = 50,
    autoConnect = true,
  } = options;

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !token || !autoConnect) {
      return;
    }

    setIsLoading(true);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    
    socketRef.current = io(`${backendUrl}/realtime`, {
      auth: {
        token: token,
      },
      query: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event
    socketRef.current.on('connect', () => {
      console.log('Connected to realtime feed');
      setIsConnected(true);
      setIsLoading(false);
    });

    // Disconnect event
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from realtime feed');
      setIsConnected(false);
    });

    // New commit event
    socketRef.current.on('new_commit', (data: any) => {
      const commitEvent: CommitEvent = {
        type: 'commit',
        ...data,
      };
      setEvents((prev) => {
        const updated = [commitEvent, ...prev];
        return updated.slice(0, maxEvents);
      });
    });

    // New PR event
    socketRef.current.on('new_pr', (data: any) => {
      const prEvent: PREvent = {
        type: 'pr',
        ...data,
      };
      setEvents((prev) => {
        const updated = [prEvent, ...prev];
        return updated.slice(0, maxEvents);
      });
    });

    // Sync started event
    socketRef.current.on('sync_started', (data: any) => {
      const syncStartedEvent: SyncStartedEvent = {
        type: 'sync_started',
        ...data,
      };
      setEvents((prev) => {
        const updated = [syncStartedEvent, ...prev];
        return updated.slice(0, maxEvents);
      });
    });

    // Sync complete event
    socketRef.current.on('sync_complete', (data: any) => {
      const syncCompleteEvent: SyncCompleteEvent = {
        type: 'sync_complete',
        ...data,
      };
      setEvents((prev) => {
        const updated = [syncCompleteEvent, ...prev];
        return updated.slice(0, maxEvents);
      });
    });

    // Error event
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      setIsLoading(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [enabled, token, maxEvents, autoConnect]);

  // Function to manually clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Function to manually disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  // Function to send ping (test connection)
  const ping = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('ping');
    }
  }, []);

  return {
    events,
    isConnected,
    isLoading,
    clearEvents,
    disconnect,
    reconnect,
    ping,
  };
};
