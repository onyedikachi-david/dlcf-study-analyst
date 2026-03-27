import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface ProfileStore {
  profile: Profile;
  setProfile: (profile: Partial<Profile>) => void;
  resetProfile: () => void;
}

const defaultProfile: Profile = {
  name: '',
  faculty: '',
  department: '',
  level: '',
  accountabilityPartner: '',
  avatarUri: undefined,
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      resetProfile: () => set({ profile: defaultProfile }),
    }),
    {
      name: STORAGE_KEYS.PROFILE,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
