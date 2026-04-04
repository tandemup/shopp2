import type { ListsStore } from "./useListsStore";

export const selectActiveLists = (s: ListsStore) =>
  s.lists.filter((l) => !l.archived);

export const selectArchivedLists = (s: ListsStore) =>
  s.lists.filter((l) => !!l.archived);

export const selectListById = (id?: string) => (s: ListsStore) =>
  id ? (s.lists.find((l) => l.id === id) ?? null) : null;
