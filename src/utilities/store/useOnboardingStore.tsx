import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { ActivityLevel, Sex, bmrMifflinStJeor, tdee, lbsToKg, inchesToCm } from '@/utilities/tdee';

export type Units = 'imperial' | 'metric';

export interface ProfileDraft {
  name: string;
  age: number | null;
  // sex: Sex;
  height: { value: number | null; units: Units };   // inches or cm
  weight: { value: number | null; units: Units };   // lbs or kg
  // activity: ActivityLevel;
  goalWeight?: { value: number | null; units: Units };
  goals?: string; // free text
  // computed:
  bmr?: number;
  tdee?: number;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  authedProvider?: 'apple' | 'google' | 'none';
  uid: string;
  draft: ProfileDraft;
  set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]): void;
  setMany(values: Partial<ProfileDraft>): void;
  computeAndFinalize(): void;
  reset(): void;
  setAuth(provider: OnboardingState['authedProvider']): void;
  setCompleted(done: boolean): void;
}

const initialDraft: ProfileDraft = {
  name: '',
  age: null,
  // sex: 'male',
  height: { value: null, units: 'imperial' },
  weight: { value: null, units: 'imperial' },
  // activity: 'light',
  goalWeight: { value: null, units: 'imperial' },
  goals: '',
  // uid: "6c122df5-9e7e-4011-8f5e-7c2682a59e81"
};

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
    hasCompletedOnboarding: true,
    authedProvider: undefined,
    draft: initialDraft,
    uid: "6c122df5-9e7e-4011-8f5e-7c2682a59e81", // TODO: remove
    set(key, value) { set(s => ({ draft: { ...s.draft, [key]: value } })); },
    setMany(values) { set(s => ({ draft: { ...s.draft, ...values } })); },
    computeAndFinalize() {
        const d = get().draft;
        if (d.age == null || d.height.value == null || d.weight.value == null) return;

        // const heightCm = d.height.units === 'imperial' ? inchesToCm(d.height.value) : d.height.value;
        // const weightKg = d.weight.units === 'imperial' ? lbsToKg(d.weight.value) : d.weight.value;

        // const BMR = bmrMifflinStJeor(d.sex, weightKg, heightCm, d.age);
        // const TDEE = tdee(BMR, d.activity);

        // set(s => ({ draft: { ...s.draft, bmr: BMR, tdee: TDEE }, hasCompletedOnboarding: true }));
    },
    reset() { set({ draft: initialDraft, hasCompletedOnboarding: false, authedProvider: undefined }); },
    setAuth(provider) { set({ authedProvider: provider }); },
    setCompleted(done) { set({ hasCompletedOnboarding: done }); },
}))
//   persist(
//     (set, get) => ({
//       hasCompletedOnboarding: false,
//       authedProvider: undefined,
//       draft: initialDraft,
//       set(key, value) { set(s => ({ draft: { ...s.draft, [key]: value } })); },
//       setMany(values) { set(s => ({ draft: { ...s.draft, ...values } })); },
//       computeAndFinalize() {
//         const d = get().draft;
//         if (d.age == null || d.height.value == null || d.weight.value == null) return;

//         const heightCm = d.height.units === 'imperial' ? inchesToCm(d.height.value) : d.height.value;
//         const weightKg = d.weight.units === 'imperial' ? lbsToKg(d.weight.value) : d.weight.value;

//         const BMR = bmrMifflinStJeor(d.sex, weightKg, heightCm, d.age);
//         const TDEE = tdee(BMR, d.activity);

//         set(s => ({ draft: { ...s.draft, bmr: BMR, tdee: TDEE }, hasCompletedOnboarding: true }));
//       },
//       reset() { set({ draft: initialDraft, hasCompletedOnboarding: false, authedProvider: undefined }); },
//       setAuth(provider) { set({ authedProvider: provider }); },
//       setCompleted(done) { set({ hasCompletedOnboarding: done }); },
//     }),
//     {
//       name: 'onboarding-v1',
//     //   storage: createJSONStorage(() => AsyncStorage),
//       storage: createJSONStorage(() => localStorage),
//       partialize: (s) => ({ hasCompletedOnboarding: s.hasCompletedOnboarding, authedProvider: s.authedProvider, draft: s.draft }),
//     }
//   )
// );
