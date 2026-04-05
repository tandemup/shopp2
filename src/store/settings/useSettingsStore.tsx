//src/store/settings/useSettingsStore.tsx
//src/utils/storage/storage.ts

import { storage } from "../../utils/storage/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Currency } from "../../types/Currency";

export type SettingsState = {
  defaultCurrency: Currency;
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setDefaultCurrency: (currency: Currency) => void;
  resetSettings: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultCurrency: "EUR",
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setDefaultCurrency: (currency) => {
        set({ defaultCurrency: currency });
      },

      resetSettings: () => {
        set({
          defaultCurrency: "EUR",
        });
      },
    }),
    {
      name: "shopp-settings-storage",
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        defaultCurrency: state.defaultCurrency,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
