import { storage } from "@/src/utils/storage/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import storesData from "@/data/stores.json";

export type StoreLocation = {
  lat: number;
  lng: number;
  source?: string;
};

export type Store = {
  id: string;
  name: string;
  address: string;
  city: string;
  zipcode: string;
  location?: StoreLocation;
};

export type StoresState = {
  stores: Store[];
  favoriteStoreIds: string[];
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  loadStoresFromSeed: () => void;

  getStoreById: (id: string) => Store | undefined;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  setFavorite: (id: string, value: boolean) => void;

  clearFavorites: () => void;
};

const normalizeSeedStores = (): Store[] => {
  const raw = Array.isArray(storesData) ? storesData : [];

  return raw.map((store: any) => ({
    id: String(store.id),
    name: String(store.name ?? "").trim(),
    address: String(store.address ?? "").trim(),
    city: String(store.city ?? "").trim(),
    zipcode: String(store.zipcode ?? "").trim(),
    location:
      store.location &&
      typeof store.location.lat === "number" &&
      typeof store.location.lng === "number"
        ? {
            lat: store.location.lat,
            lng: store.location.lng,
            source:
              typeof store.location.source === "string"
                ? store.location.source
                : undefined,
          }
        : undefined,
  }));
};

const seedStores = normalizeSeedStores();

export const useStoresStore = create<StoresState>()(
  persist(
    (set, get) => ({
      stores: seedStores,
      favoriteStoreIds: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      loadStoresFromSeed: () => {
        set({ stores: seedStores });
      },

      getStoreById: (id: string) => {
        return get().stores.find((store) => store.id === id);
      },

      isFavorite: (id: string) => {
        return get().favoriteStoreIds.includes(id);
      },

      toggleFavorite: (id: string) => {
        set((state) => {
          const exists = state.favoriteStoreIds.includes(id);

          return {
            favoriteStoreIds: exists
              ? state.favoriteStoreIds.filter((x) => x !== id)
              : [...state.favoriteStoreIds, id],
          };
        });
      },

      setFavorite: (id: string, value: boolean) => {
        set((state) => {
          const exists = state.favoriteStoreIds.includes(id);

          if (value && !exists) {
            return { favoriteStoreIds: [...state.favoriteStoreIds, id] };
          }

          if (!value && exists) {
            return {
              favoriteStoreIds: state.favoriteStoreIds.filter((x) => x !== id),
            };
          }

          return state;
        });
      },

      clearFavorites: () => {
        set({ favoriteStoreIds: [] });
      },
    }),
    {
      name: "shopp-stores-storage",
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        favoriteStoreIds: state.favoriteStoreIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.loadStoresFromSeed();
      },
    },
  ),
);
