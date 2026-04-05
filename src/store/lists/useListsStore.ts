// src/store/lists/useListsStore.ts
import { storage } from "@/src/utils/storage/storage";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useSettingsStore } from "@/src/store/settings/useSettingsStore";
import type { Item } from "@/src/types/Item";
import type { List } from "@/src/types/List";
import { generateId } from "@/src/utils/generateId";

const toNumber = (v: any, fallback: number) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export type ListsStore = {
  lists: List[];
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;

  addList: (name: string) => void;
  deleteList: (id: string) => void;
  archiveList: (id: string) => void;
  updateList: (id: string, updates: Partial<List>) => void;
  getList: (id: string) => List | null;

  addItem: (listId: string, item: Partial<Item>) => void;
  updateItem: (listId: string, itemId: string, updates: Partial<Item>) => void;
  removeItem: (listId: string, itemId: string) => void;
  toggleItem: (listId: string, itemId: string) => void;

  findItemById: (itemId: string) => { list: List; item: Item } | null;

  assignStoreToList: (listId: string, storeId: string) => void;

  clearLists: () => void;
};

export const useListsStore = create<ListsStore>()(
  persist(
    (set, get) => ({
      lists: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      addList: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const newList: List = {
          id: generateId(),
          name: trimmed,
          createdAt: Date.now(),
          currency: useSettingsStore.getState().defaultCurrency,
          items: [],
          archived: false,
        };

        set((state) => ({
          lists: [newList, ...state.lists],
        }));
      },

      deleteList: (id: string) => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== id),
        }));
      },

      archiveList: (id: string) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === id
              ? {
                  ...l,
                  archived: true,
                  items: l.items.filter((i) => i.checked),
                }
              : l,
          ),
        }));
      },

      updateList: (id: string, updates: Partial<List>) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === id
              ? {
                  ...l,
                  ...updates,
                  name:
                    typeof updates.name === "string"
                      ? updates.name.trim()
                      : l.name,
                }
              : l,
          ),
        }));
      },

      getList: (id: string) => {
        return get().lists.find((l) => l.id === id) || null;
      },

      addItem: (listId: string, item: Partial<Item>) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id !== listId) return list;

            const newItem: Item = {
              id: generateId(),
              name: item.name?.trim() || "Nuevo producto",
              quantity: toNumber(item.quantity, 1),
              unit: item.unit?.trim() || "u",
              unitPrice: toNumber(item.unitPrice, 0),
              checked: item.checked ?? true,
              promo: item.promo ?? { type: "none" },
              barcode: item.barcode?.trim() ?? "",
            };

            return {
              ...list,
              items: [newItem, ...list.items],
            };
          }),
        }));
      },

      updateItem: (listId: string, itemId: string, updates: Partial<Item>) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id !== listId) return list;

            return {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      ...updates,
                      name:
                        typeof updates.name === "string"
                          ? updates.name.trim()
                          : item.name,
                      barcode:
                        typeof updates.barcode === "string"
                          ? updates.barcode.trim()
                          : item.barcode,
                      unit:
                        typeof updates.unit === "string"
                          ? updates.unit.trim() || "u"
                          : item.unit,
                      quantity: toNumber(updates.quantity ?? item.quantity, 1),
                      unitPrice: toNumber(
                        updates.unitPrice ?? item.unitPrice,
                        0,
                      ),
                    }
                  : item,
              ),
            };
          }),
        }));
      },

      removeItem: (listId: string, itemId: string) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id !== listId) return list;

            return {
              ...list,
              items: list.items.filter((i) => i.id !== itemId),
            };
          }),
        }));
      },

      toggleItem: (listId: string, itemId: string) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id !== listId) return list;

            return {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item,
              ),
            };
          }),
        }));
      },

      findItemById: (itemId: string) => {
        for (const list of get().lists) {
          const item = list.items.find((i) => i.id === itemId);
          if (item) return { list, item };
        }
        return null;
      },

      assignStoreToList: (listId: string, storeId: string) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId ? { ...list, storeId } : list,
          ),
        }));
      },

      clearLists: () => set({ lists: [] }),
    }),
    {
      name: "shopp-lists-storage",
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        lists: state.lists,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
