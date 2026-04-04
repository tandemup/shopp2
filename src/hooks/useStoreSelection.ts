import { useLocalSearchParams, useRouter } from "expo-router";

export function useStoreSelection() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const selectForListId = Array.isArray(params.selectForListId)
    ? params.selectForListId[0]
    : params.selectForListId;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  const isSelectMode = mode === "select";

  const handleSelectStore = (store: { id: string }) => {
    router.push({
      pathname: "/storefront/info",
      params: {
        id: store.id,
        ...(isSelectMode
          ? {
              mode: "select",
              selectForListId,
              returnTo,
            }
          : {}),
      },
    });
  };

  return {
    handleSelectStore,
    isSelectMode,
  };
}
