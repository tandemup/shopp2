import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Store } from "@/src/store/stores/useStoresStore";
import { useStoresStore } from "@/src/store/stores/useStoresStore";

type Props = {
  store: Store;
  onPress?: () => void;
};

export default function StoreRow({ store, onPress }: Props) {
  const toggleFavorite = useStoresStore((s) => s.toggleFavorite);
  const isFavorite = useStoresStore((s) => s.isFavorite);

  const favorite = isFavorite(store.id);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.textWrap}>
          <Text style={styles.name}>{store.name}</Text>

          {!!store.address && (
            <Text style={styles.address}>{store.address}</Text>
          )}

          {!!store.city && <Text style={styles.city}>{store.city}</Text>}
        </View>

        <Pressable
          style={styles.starButton}
          onPress={() => toggleFavorite(store.id)}
          hitSlop={10}
        >
          <Ionicons
            name={favorite ? "star" : "star-outline"}
            size={20}
            color={favorite ? "#f5c518" : "#9ca3af"}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
  },

  textWrap: {
    flex: 1,
    paddingRight: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },

  address: {
    fontSize: 14,
    color: "#4b5563",
  },

  city: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  starButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
