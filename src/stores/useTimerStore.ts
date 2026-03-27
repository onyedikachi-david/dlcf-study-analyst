import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TimerSession } from '../types';
import { STORAGE_KEYS, POMODORO } from '../utils/constants';

interface TimerStore {
  session: TimerSession | null;
  isVisible: boolean;

  startWork: (subject: string) => void;
  startBreak: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  cancel: () => void;
  updateElapsed: (mins: number) => void;
  setVisible: (visible: boolean) => void;
  incrementPomodoroCount: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      session: null,
      isVisible: false,

      startWork: (subject) =>
        set({
          session: {
            subject,
            durationMins: POMODORO.WORK_MINS,
            elapsedMins: 0,
            startedAt: Date.now(),
            type: 'work',
            status: 'running',
            pomodoroCount: get().session?.pomodoroCount ?? 0,
          },
          isVisible: true,
        }),

      startBreak: () =>
        set((state) => ({
          session: state.session
            ? {
                ...state.session,
                durationMins: POMODORO.BREAK_MINS,
                elapsedMins: 0,
                startedAt: Date.now(),
                type: 'break',
                status: 'running',
              }
            : null,
          isVisible: true,
        })),

      pause: () =>
        set((state) => ({
          session: state.session
            ? { ...state.session, status: 'paused' }
            : null,
        })),

      resume: () =>
        set((state) => ({
          session: state.session
            ? { ...state.session, status: 'running', startedAt: Date.now() }
            : null,
        })),

      stop: () =>
        set((state) => ({
          session: state.session
            ? { ...state.session, status: 'completed' }
            : null,
        })),

      complete: () =>
        set((state) => ({
          session: state.session
            ? { ...state.session, status: 'completed' }
            : null,
        })),

      cancel: () =>
        set((state) => ({
          session: state.session
            ? { ...state.session, status: 'cancelled' }
            : null,
        })),

      updateElapsed: (mins) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, elapsedMins: mins }
            : null,
        })),

      setVisible: (visible) => set({ isVisible: visible }),

      incrementPomodoroCount: () =>
        set((state) => ({
          session: state.session
            ? { ...state.session, pomodoroCount: state.session.pomodoroCount + 1 }
            : null,
        })),

      reset: () => set({ session: null, isVisible: false }),
    }),
    {
      name: STORAGE_KEYS.TIMER,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
