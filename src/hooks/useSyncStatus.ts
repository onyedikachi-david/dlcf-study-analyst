import { useEffect, useState, useCallback, useRef } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useAuth } from "../contexts/AuthContext";
import type { SyncStatus } from "@/components/SyncStatusIndicator";

interface SyncStatusState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  isOnline: boolean;
  pendingChanges: number;
}

interface SyncStatusEvent {
  type: "online" | "offline" | "synced" | "error" | "syncing";
  hasPendingChanges?: boolean;
}

interface UseSyncStatusReturn extends SyncStatusState {
  triggerSync: () => Promise<void>;
  markAsSyncing: () => void;
  markAsSynced: () => void;
  markAsError: () => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
  resetPendingChanges: () => void;
  lastEvent: SyncStatusEvent | null;
  clearLastEvent: () => void;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const { user } = useAuth();
  const [state, setState] = useState<SyncStatusState>({
    status: "synced",
    lastSyncedAt: null,
    isOnline: true,
    pendingChanges: 0,
  });

  const [lastEvent, setLastEvent] = useState<SyncStatusEvent | null>(null);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOnlineRef = useRef<boolean | null>(null);
  const hasInitializedRef = useRef(false);

  const clearLastEvent = useCallback(() => {
    setLastEvent(null);
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isConnected = netState.isConnected ?? false;

      // Only emit events after initial mount (not on first render)
      if (hasInitializedRef.current) {
        // Emit event when coming back online
        if (isConnected && prevOnlineRef.current === false) {
          setState((prev) => {
            setLastEvent({
              type: "online",
              hasPendingChanges: prev.pendingChanges > 0,
            });
            return prev;
          });
        }

        // Emit event when going offline
        if (!isConnected && prevOnlineRef.current === true) {
          setLastEvent({ type: "offline" });
        }
      }

      prevOnlineRef.current = isConnected;
      hasInitializedRef.current = true;

      setState((prev) => {
        // If we just came back online and have pending changes, set to syncing
        if (isConnected && !prev.isOnline && prev.pendingChanges > 0) {
          return {
            ...prev,
            isOnline: isConnected,
            status: "syncing",
          };
        }

        // If we went offline, update status
        if (!isConnected) {
          return {
            ...prev,
            isOnline: false,
            status: prev.pendingChanges > 0 ? "offline" : prev.status,
          };
        }

        return {
          ...prev,
          isOnline: isConnected,
        };
      });
    });

    // Check initial network state
    NetInfo.fetch().then((netState) => {
      const isConnected = netState.isConnected ?? false;
      prevOnlineRef.current = isConnected;
      setState((prev) => ({
        ...prev,
        isOnline: isConnected,
      }));
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Update status based on online state and pending changes
  useEffect(() => {
    if (!state.isOnline && state.pendingChanges > 0) {
      setState((prev) => ({ ...prev, status: "offline" }));
    }
  }, [state.isOnline, state.pendingChanges]);

  const markAsSyncing = useCallback(() => {
    setState((prev) => ({ ...prev, status: "syncing" }));
    setLastEvent({ type: "syncing" });
  }, []);

  const markAsSynced = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "synced",
      lastSyncedAt: new Date(),
      pendingChanges: 0,
    }));
    setLastEvent({ type: "synced" });
  }, []);

  const markAsError = useCallback(() => {
    setState((prev) => ({ ...prev, status: "error" }));
    setLastEvent({ type: "error" });
  }, []);

  const incrementPendingChanges = useCallback(() => {
    setState((prev) => {
      const newPending = prev.pendingChanges + 1;
      return {
        ...prev,
        pendingChanges: newPending,
        status: prev.isOnline ? prev.status : "offline",
      };
    });
  }, []);

  const decrementPendingChanges = useCallback(() => {
    setState((prev) => {
      const newPending = Math.max(0, prev.pendingChanges - 1);
      return {
        ...prev,
        pendingChanges: newPending,
        status: newPending === 0 && prev.isOnline ? "synced" : prev.status,
      };
    });
  }, []);

  const resetPendingChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingChanges: 0,
    }));
  }, []);

  const triggerSync = useCallback(async () => {
    if (!user) return;
    if (!state.isOnline) {
      setState((prev) => ({ ...prev, status: "offline" }));
      setLastEvent({ type: "offline" });
      return;
    }

    setState((prev) => ({ ...prev, status: "syncing" }));
    setLastEvent({ type: "syncing" });

    // Simulate sync delay - in real implementation, this would call actual sync services
    // The actual sync logic should be handled by the component using this hook
    // This is just to provide the state management

    // Auto-transition to synced after a delay if no error occurs
    // In real usage, the component should call markAsSynced() or markAsError()
    syncTimeoutRef.current = setTimeout(() => {
      setState((prev) => {
        if (prev.status === "syncing") {
          setLastEvent({ type: "synced" });
          return {
            ...prev,
            status: "synced",
            lastSyncedAt: new Date(),
          };
        }
        return prev;
      });
    }, 3000);
  }, [user, state.isOnline]);

  return {
    ...state,
    triggerSync,
    markAsSyncing,
    markAsSynced,
    markAsError,
    incrementPendingChanges,
    decrementPendingChanges,
    resetPendingChanges,
    lastEvent,
    clearLastEvent,
  };
}

export default useSyncStatus;
