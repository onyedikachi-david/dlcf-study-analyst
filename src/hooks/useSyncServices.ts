import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ProfileSyncService,
  LeaderboardSyncService,
  StudySessionsSyncService,
} from '../services';

/**
 * Custom hook to easily use sync services in components
 */
export function useSyncServices() {
  const { user } = useAuth();

  // Profile sync methods
  const syncProfile = useCallback(async () => {
    if (!user) return { error: new Error('User not authenticated') };
    return await ProfileSyncService.syncProfile(user.id);
  }, [user]);

  const updateProfile = useCallback(
    async (updates: any) => {
      if (!user) return { error: new Error('User not authenticated') };
      return await ProfileSyncService.updateProfile(user.id, updates);
    },
    [user]
  );

  const uploadAvatar = useCallback(
    async (fileUri: string, fileType?: string) => {
      if (!user) return { url: null, error: new Error('User not authenticated') };
      return await ProfileSyncService.uploadAvatar(user.id, fileUri, fileType);
    },
    [user]
  );

  const deleteAvatar = useCallback(async () => {
    if (!user) return { error: new Error('User not authenticated') };
    return await ProfileSyncService.deleteAvatar(user.id);
  }, [user]);

  // Study sessions sync methods
  const syncDaySession = useCallback(
    async (dayEntry: any) => {
      if (!user) return { error: new Error('User not authenticated') };
      return await StudySessionsSyncService.syncDaySessions(user.id, dayEntry);
    },
    [user]
  );

  const syncWeekSessions = useCallback(async () => {
    if (!user) return { error: new Error('User not authenticated') };
    return await StudySessionsSyncService.syncWeekSessions(user.id);
  }, [user]);

  const getWeekTotal = useCallback(async () => {
    if (!user) return { total: 0, error: new Error('User not authenticated') };
    return await StudySessionsSyncService.getWeekTotalMinutes(user.id);
  }, [user]);

  const getMostStudiedTopic = useCallback(async () => {
    if (!user) return { topic: '', error: new Error('User not authenticated') };
    return await StudySessionsSyncService.getMostStudiedTopic(user.id);
  }, [user]);

  // Leaderboard sync methods
  const pinToLeaderboard = useCallback(
    async (entry: {
      name: string;
      faculty: string;
      department: string;
      level: string;
      totalMinutes: number;
      badges: string[];
    }) => {
      if (!user) return { error: new Error('User not authenticated') };
      return await LeaderboardSyncService.pinToLeaderboard(user.id, entry);
    },
    [user]
  );

  const addReaction = useCallback(
    async (name: string, reactionType: 'cheers' | 'fire' | 'star' | 'heart') => {
      return await LeaderboardSyncService.addReactionByName(name, reactionType);
    },
    []
  );

  const getUserRank = useCallback(async () => {
    if (!user) return { rank: 0, error: new Error('User not authenticated') };
    return await LeaderboardSyncService.getUserRank(user.id);
  }, [user]);

  const refreshLeaderboard = useCallback(async () => {
    return await LeaderboardSyncService.fetchLeaderboard();
  }, []);

  return {
    // Profile methods
    syncProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,

    // Study sessions methods
    syncDaySession,
    syncWeekSessions,
    getWeekTotal,
    getMostStudiedTopic,

    // Leaderboard methods
    pinToLeaderboard,
    addReaction,
    getUserRank,
    refreshLeaderboard,

    // User info
    userId: user?.id || null,
    isAuthenticated: !!user,
  };
}
