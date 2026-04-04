// app/list/[id].tsx

import ItemRow from "@/src/components/items/ItemRow";
import FooterTotal from "@/src/components/shopping/FooterTotal";
import SearchCombinedBar from "@/src/components/shopping/SearchCombinedBar";
import StoreSelector from "@/src/components/stores/StoreSelector";
import { useListsStore } from "@/src/store/lists/useListsStore";
import { useStoresStore } from "@/src/store/stores/useStoresStore";
import type { Item } from "@/src/types/Item";
import { calculateItemPrice } from "@/src/utils/pricing/pricing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";

function makeNewItem(name: string): Partial<Item> {
  return {
    name: name.trim(),
    unit: "u",
    quantity: 1,
    unitPrice: 0,
    promo: { type: "none" },
    checked: true,
  };
}

export default function ShoppingListScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const hasHydratedLists = useListsStore((s) => s.hasHydrated);
  const hasHydratedStores = useStoresStore((s) => s.hasHydrated);

  const getList = useListsStore((s) => s.getList);
  const addItem = useListsStore((s) => s.addItem);
  const toggleItem = useListsStore((s) => s.toggleItem);

  const getStoreById = useStoresStore((s) => s.getStoreById);

  if (!hasHydratedLists || !hasHydratedStores) {
    return null;
  }

  const list = getList(id);

  if (!list) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Lista no encontrada</Text>
      </View>
    );
  }

  const store = list.storeId ? getStoreById(list.storeId) : undefined;

  const totals = list.items
    .filter((item) => item.checked)
    .reduce(
      (acc, item) => {
        const price = calculateItemPrice(item);
        acc.total += price.total;
        acc.savings += price.savings;
        return acc;
      },
      { total: 0, savings: 0 },
    );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{list.name}</Text>

      <StoreSelector
        store={store}
        onPress={() =>
          router.push({
            pathname: "/storefront/favorites",
            params: {
              mode: "select",
              selectForListId: list.id,
              returnTo: `/list/${list.id}`,
            },
          })
        }
      />

      <SearchCombinedBar
        onAdd={(name) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          addItem(list.id, makeNewItem(trimmed));
        }}
      />

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onToggle={() => toggleItem(list.id, item.id)}
            onPress={() => router.push(`/item/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No hay productos</Text>
            <Text style={styles.emptyText}>
              Añade uno desde la barra de búsqueda.
            </Text>
          </View>
        }
      />

      <FooterTotal
        total={totals.total}
        savings={totals.savings}
        onCheckout={() => {
          console.log("checkout");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f2f2f2",
  },

  header: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 10,
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
  },

  emptyText: {
    color: "#666",
  },
});
