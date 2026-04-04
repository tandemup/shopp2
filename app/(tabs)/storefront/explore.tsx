import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { StoreCard } from "@/src/components/stores/StoreCard";
import { useStoreSelection } from "@/src/hooks/useStoreSelection";
import type { Store } from "@/src/store/stores/useStoresStore";
import { useStoresStore } from "@/src/store/stores/useStoresStore";

function matchesStore(store: Store, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [store.name, store.address, store.city, store.zipcode]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(q));
}

export default function StoreExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const selectForListId = Array.isArray(params.selectForListId)
    ? params.selectForListId[0]
    : params.selectForListId;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  const hasHydrated = useStoresStore((s) => s.hasHydrated);
  const stores = useStoresStore((s) => s.stores);
  const toggleFavorite = useStoresStore((s) => s.toggleFavorite);
  const isFavorite = useStoresStore((s) => s.isFavorite);

  const { handleSelectStore } = useStoreSelection();

  const [query, setQuery] = useState("");

  const filteredStores = useMemo(() => {
    return stores
      .filter((store) => matchesStore(store, query))
      .sort((a, b) => {
        const aFav = isFavorite(a.id) ? 1 : 0;
        const bFav = isFavorite(b.id) ? 1 : 0;

        if (aFav !== bFav) return bFav - aFav;
        return a.name.localeCompare(b.name, "es");
      });
  }, [stores, query, isFavorite]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {mode === "select" ? "Seleccionar tienda" : "Explorar tiendas"}
      </Text>

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por nombre, dirección, ciudad..."
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <FlatList
        data={filteredStores}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <StoreCard
            store={item}
            onPress={() =>
              handleSelectStore({
                id: item.id,
              })
            }
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No se han encontrado tiendas</Text>
            <Text style={styles.emptyText}>
              Prueba con otro texto de búsqueda.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  header: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111",
  },

  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },

  listContent: {
    paddingBottom: 24,
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#111",
  },

  emptyText: {
    color: "#666",
  },
});
