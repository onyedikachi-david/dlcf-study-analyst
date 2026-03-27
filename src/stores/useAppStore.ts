import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArchiveEntry } from '../types';
import { STORAGE_KEYS, DEFAULT_GOAL_MINS } from '../utils/constants';

interface AppStore {
  goalMins: number;
  partner: string;
  facts: string[];
  archives: ArchiveEntry[];
  earnedBadges: string[];
  cumulativeMinutes: number;

  setGoalMins: (mins: number) => void;
  setPartner: (name: string) => void;

  addFact: (fact: string) => boolean;
  removeFact: (index: number) => void;

  addArchive: (entry: Omit<ArchiveEntry, 'id'>) => void;
  clearArchives: () => void;

  addEarnedBadges: (badges: string[]) => void;
  clearEarnedBadges: () => void;

  addCumulativeMinutes: (mins: number) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      goalMins: DEFAULT_GOAL_MINS,
      partner: '',
      facts: [],
      archives: [],
      earnedBadges: [],
      cumulativeMinutes: 0,

      setGoalMins: (mins) => set({ goalMins: mins }),
      setPartner: (name) => set({ partner: name }),

      addFact: (fact) => {
        const state = get();
        if (state.facts.length >= 50) return false;
        set({ facts: [fact, ...state.facts] });
        return true;
      },

      removeFact: (index) =>
        set((state) => ({
          facts: state.facts.filter((_, i) => i !== index),
        })),

      addArchive: (entry) =>
        set((state) => {
          const newArchive: ArchiveEntry = { ...entry, id: Date.now() };
          const updated = [newArchive, ...state.archives].slice(0, 30);
          return { archives: updated };
        }),

      clearArchives: () => set({ archives: [] }),

      addEarnedBadges: (badges) =>
        set((state) => ({
          earnedBadges: [...new Set([...state.earnedBadges, ...badges])],
        })),

      clearEarnedBadges: () => set({ earnedBadges: [] }),

      addCumulativeMinutes: (mins) =>
        set((state) => ({
          cumulativeMinutes: state.cumulativeMinutes + mins,
        })),

      resetAll: () =>
        set({
          goalMins: DEFAULT_GOAL_MINS,
          partner: '',
          facts: [],
          archives: [],
          earnedBadges: [],
          cumulativeMinutes: 0,
        }),
    }),
    {
      name: STORAGE_KEYS.GOAL_MINS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
