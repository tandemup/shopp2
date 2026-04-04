import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { StoreCard } from "@/src/components/stores/StoreCard";
import { useListsStore } from "@/src/store/lists/useListsStore";
import { selectFavorites } from "@/src/store/stores/selectors";
import type { Store } from "@/src/store/stores/useStoresStore";
import { useStoresStore } from "@/src/store/stores/useStoresStore";

export default function StoreFavoritesScreen() {
  const router = useRouter();

  const assignStoreToList = useListsStore((s) => s.assignStoreToList);
  const hasHydrated = useStoresStore((s) => s.hasHydrated);
  const favorites = useStoresStore(selectFavorites);
  const toggleFavorite = useStoresStore((s) => s.toggleFavorite);

  const params = useLocalSearchParams();
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const selectForListId = Array.isArray(params.selectForListId)
    ? params.selectForListId[0]
    : params.selectForListId;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  const isSelectMode = mode === "select";

  const handleSelectStore = (store: Store) => {
    if (isSelectMode && selectForListId) {
      assignStoreToList(String(selectForListId), store.id);

      if (returnTo && typeof returnTo === "string") {
        router.replace(returnTo as any);
      } else {
        router.replace({
          pathname: "/list/[id]",
          params: { id: String(selectForListId) },
        });
      }
      return;
    }

    router.push({
      pathname: "/storefront/info",
      params: { id: store.id },
    });
  };

  useEffect(() => {
    if (isSelectMode && hasHydrated && favorites.length === 0) {
      router.replace({
        pathname: "/storefront/explore",
        params: {
          mode: "select",
          selectForListId,
          ...(returnTo ? { returnTo } : {}),
        },
      });
    }
  }, [favorites, hasHydrated, isSelectMode, selectForListId, returnTo, router]);

  const renderItem = ({ item }: { item: Store }) => (
    <StoreCard
      store={item}
      onPress={() => handleSelectStore(item)}
      onToggleFavorite={() => toggleFavorite(item.id)}
    />
  );

  if (!hasHydrated) {
    return null;
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>No tienes tiendas favoritas</Text>
        <Text style={styles.subtitle}>
          Marca una tienda ⭐ para acceder rápidamente
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/storefront/explore",
              ...(isSelectMode
                ? {
                    params: {
                      mode: "select",
                      selectForListId,
                      ...(returnTo ? { returnTo } : {}),
                    },
                  }
                : {}),
            })
          }
        >
          <Text style={styles.buttonText}>Explorar tiendas</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Favoritas</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#f5f5f5",
  },

  header: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111",
  },

  listContent: {
    paddingBottom: 24,
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#111",
  },

  subtitle: {
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },

  button: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
