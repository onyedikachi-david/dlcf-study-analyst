import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Achievement, AchievementProgress } from '../utils/achievements';
import { calculateAchievements, ALL_ACHIEVEMENTS } from '../utils/achievements';

interface AchievementsState {
  // Progress tracking
  progress: AchievementProgress;

  // Achievements list
  achievements: Achievement[];

  // Recently unlocked (for notifications)
  recentlyUnlocked: Achievement[];

  // Actions
  updateProgress: (updates: Partial<AchievementProgress>) => void;
  incrementProgress: (field: keyof AchievementProgress, amount?: number) => void;
  checkAchievements: () => Achievement[];
  clearRecentlyUnlocked: () => void;
  resetAchievements: () => void;
}

const initialProgress: AchievementProgress = {
  totalHours: 0,
  currentStreak: 0,
  longestStreak: 0,
  leaderboardRank: 0,
  totalReactions: 0,
  bestDayMinutes: 0,
  perfectWeeks: 0,
  morningSessionsCount: 0,
  eveningSessionsCount: 0,
  topRatingsCount: 0,
  archivedWeeks: 0,
  factsCount: 0,
  badgesCount: 0,
  profileComplete: false,
  weekendStudyCount: 0,
};

const initialAchievements: Achievement[] = ALL_ACHIEVEMENTS.map(a => ({
  ...a,
  unlocked: false,
  progress: 0,
}));

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      achievements: initialAchievements,
      recentlyUnlocked: [],

      updateProgress: (updates) => {
        set((state) => {
          const newProgress = { ...state.progress, ...updates };
          const updatedAchievements = calculateAchievements(newProgress);

          // Find newly unlocked achievements
          const newlyUnlocked = updatedAchievements.filter(
            (achievement) =>
              achievement.unlocked &&
              !state.achievements.find(
                (a) => a.id === achievement.id && a.unlocked
              )
          );

          return {
            progress: newProgress,
            achievements: updatedAchievements,
            recentlyUnlocked: [
              ...state.recentlyUnlocked,
              ...newlyUnlocked,
            ],
          };
        });
      },

      incrementProgress: (field, amount = 1) => {
        set((state) => {
          const currentValue = state.progress[field];
          let newValue: any;

          if (typeof currentValue === 'number') {
            newValue = currentValue + amount;
          } else if (typeof currentValue === 'boolean') {
            newValue = true;
          } else {
            newValue = currentValue;
          }

          const newProgress = {
            ...state.progress,
            [field]: newValue,
          };

          const updatedAchievements = calculateAchievements(newProgress);

          // Find newly unlocked achievements
          const newlyUnlocked = updatedAchievements.filter(
            (achievement) =>
              achievement.unlocked &&
              !state.achievements.find(
                (a) => a.id === achievement.id && a.unlocked
              )
          );

          return {
            progress: newProgress,
            achievements: updatedAchievements,
            recentlyUnlocked: [
              ...state.recentlyUnlocked,
              ...newlyUnlocked,
            ],
          };
        });
      },

      checkAchievements: () => {
        const state = get();
        const updatedAchievements = calculateAchievements(state.progress);

        const newlyUnlocked = updatedAchievements.filter(
          (achievement) =>
            achievement.unlocked &&
            !state.achievements.find(
              (a) => a.id === achievement.id && a.unlocked
            )
        );

        set({
          achievements: updatedAchievements,
          recentlyUnlocked: [
            ...state.recentlyUnlocked,
            ...newlyUnlocked,
          ],
        });

        return newlyUnlocked;
      },

      clearRecentlyUnlocked: () => {
        set({ recentlyUnlocked: [] });
      },

      resetAchievements: () => {
        set({
          progress: initialProgress,
          achievements: initialAchievements,
          recentlyUnlocked: [],
        });
      },
    }),
    {
      name: 'achievements-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
