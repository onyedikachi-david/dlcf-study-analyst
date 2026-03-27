import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DayEntry, DayName, Session } from '../types';
import { STORAGE_KEYS, createEmptyWeek, DAYS } from '../utils/constants';
import { getWeekStartTimestamp } from '../utils/time';

interface WeekStore {
  week: DayEntry[];
  weekStartTimestamp: number;
  updateSession: (day: DayName, sessionKey: 'st1' | 'st2' | 'st3', session: Partial<Session>) => void;
  updateDayField: (day: DayName, field: 'usr' | 'topics' | 'efficiency', value: string | number) => void;
  addTimeToNextAvailableSlot: (day: DayName, startTime: string, stopTime: string, topic: string) => void;
  resetWeek: () => void;
  checkAndResetIfNewWeek: () => boolean;
}

export const useWeekStore = create<WeekStore>()(
  persist(
    (set, get) => ({
      week: createEmptyWeek(),
      weekStartTimestamp: getWeekStartTimestamp(),

      updateSession: (day, sessionKey, sessionUpdate) =>
        set((state) => ({
          week: state.week.map((d) =>
            d.day === day
              ? { ...d, [sessionKey]: { ...d[sessionKey], ...sessionUpdate } }
              : d
          ),
        })),

      updateDayField: (day, field, value) =>
        set((state) => ({
          week: state.week.map((d) =>
            d.day === day ? { ...d, [field]: value } : d
          ),
        })),

      addTimeToNextAvailableSlot: (day, startTime, stopTime, topic) =>
        set((state) => {
          const newWeek = state.week.map((d) => {
            if (d.day !== day) return d;

            const updated = { ...d };

            if (!d.st1.start && !d.st1.stop) {
              updated.st1 = { start: startTime, stop: stopTime };
            } else if (!d.st2.start && !d.st2.stop) {
              updated.st2 = { start: startTime, stop: stopTime };
            } else if (!d.st3.start && !d.st3.stop) {
              updated.st3 = { start: startTime, stop: stopTime };
            }

            if (topic) {
              updated.topics = d.topics
                ? `${d.topics}, ${topic}`
                : topic;
            }

            return updated;
          });

          return { week: newWeek };
        }),

      resetWeek: () =>
        set({
          week: createEmptyWeek(),
          weekStartTimestamp: getWeekStartTimestamp(),
        }),

      checkAndResetIfNewWeek: () => {
        const currentWeekStart = getWeekStartTimestamp();
        const storedWeekStart = get().weekStartTimestamp;

        if (currentWeekStart > storedWeekStart) {
          set({
            week: createEmptyWeek(),
            weekStartTimestamp: currentWeekStart,
          });
          return true;
        }
        return false;
      },
    }),
    {
      name: STORAGE_KEYS.WEEK,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
