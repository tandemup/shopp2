import type { Store, StoresState } from "./useStoresStore";

export const selectStores = (s: StoresState) => s.stores;

export const selectFavoriteStoreIds = (s: StoresState) => s.favoriteStoreIds;

export const selectFavorites = (s: StoresState): Store[] =>
  s.stores.filter((store) => s.favoriteStoreIds.includes(store.id));

export const selectStoreById =
  (id?: string) =>
  (s: StoresState): Store | undefined =>
    id ? s.stores.find((store) => store.id === id) : undefined;
