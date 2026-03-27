import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LeaderboardEntry, Reaction } from '../types';
import { STORAGE_KEYS, DEMO_PINS } from '../utils/constants';

interface LeaderboardStore {
  entries: LeaderboardEntry[];
  hasSeeded: boolean;
  react: (name: string, type: keyof Reaction) => void;
  upsert: (entry: LeaderboardEntry) => void;
  getUserRank: (name: string) => number;
  reset: () => void;
  seedIfNeeded: () => void;
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      entries: [],
      hasSeeded: false,

      react: (name, type) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.name === name
              ? {
                  ...e,
                  reactions: {
                    ...e.reactions,
                    [type]: e.reactions[type] + 1,
                  },
                }
              : e
          ),
        })),

      upsert: (entry) =>
        set((state) => {
          const filtered = state.entries.filter(
            (e) => e.name.toLowerCase() !== entry.name.toLowerCase()
          );
          const updated = [...filtered, entry]
            .sort((a, b) => {
              if (b.hours !== a.hours) return b.hours - a.hours;
              return a.name.localeCompare(b.name);
            })
            .slice(0, 12);
          return { entries: updated };
        }),

      getUserRank: (name) => {
        const entries = get().entries;
        const index = entries.findIndex(
          (e) => e.name.toLowerCase() === name.toLowerCase()
        );
        return index === -1 ? 0 : index + 1;
      },

      reset: () => set({ entries: [], hasSeeded: false }),

      seedIfNeeded: () => {
        const state = get();
        if (!state.hasSeeded && state.entries.length === 0) {
          set({ entries: DEMO_PINS, hasSeeded: true });
        }
      },
    }),
    {
      name: STORAGE_KEYS.LEADERBOARD,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
