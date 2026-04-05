import StoreMapPreview from "../../../src/components/stores/StoreMapPreview";
import { useListsStore } from "../../../src/store/lists/useListsStore";
import { useStoresStore } from "../../../src/store/stores/useStoresStore";
import { getValidCoords } from "../../../src/utils/maps/getValidCoords";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StoreDetailScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const selectForListId = Array.isArray(params.selectForListId)
    ? params.selectForListId[0]
    : params.selectForListId;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  const router = useRouter();

  const hasHydrated = useStoresStore((s) => s.hasHydrated);
  const getStoreById = useStoresStore((s) => s.getStoreById);
  const toggleFavorite = useStoresStore((s) => s.toggleFavorite);
  const isFavorite = useStoresStore((s) => s.isFavorite);

  const assignStoreToList = useListsStore((s) => s.assignStoreToList);

  const store = id ? getStoreById(id) : undefined;
  const coords = useMemo(() => (store ? getValidCoords(store) : null), [store]);

  if (!hasHydrated) {
    return null;
  }

  if (!store) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Tienda no encontrada</Text>
      </View>
    );
  }

  const favorite = isFavorite(store.id);

  const handleToggleFavorite = () => {
    toggleFavorite(store.id);
  };

  const handleSelectStore = () => {
    if (mode === "select" && selectForListId) {
      assignStoreToList(String(selectForListId), store.id);

      if (returnTo && typeof returnTo === "string") {
        router.replace(returnTo as any);
      } else {
        router.replace({
          pathname: "/list/[id]",
          params: { id: String(selectForListId) },
        });
      }
    }
  };

  const openInOpenStreetMap = () => {
    if (!coords) return;
    const { lat, lng } = coords;
    const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
    Linking.openURL(url);
  };

  const openInGoogleMaps = () => {
    if (!coords) return;
    const { lat, lng } = coords;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>
          {store.name}
        </Text>

        <Pressable onPress={handleToggleFavorite} hitSlop={10}>
          <Ionicons
            name={favorite ? "star" : "star-outline"}
            size={26}
            color={favorite ? "#f5c518" : "#bbb"}
          />
        </Pressable>
      </View>

      {store.address && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dirección</Text>
          <Text style={styles.sectionText}>
            📍 {store.address}
            {store.city ? `, ${store.city}` : ""}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Ubicación</Text>

        {coords ? (
          <View style={styles.mapContainer}>
            <StoreMapPreview lat={coords.lat} lng={coords.lng} />
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={36} color="#999" />
            <Text style={styles.mapPlaceholderText}>
              Ubicación no disponible
            </Text>
          </View>
        )}

        <Pressable style={styles.osmButton} onPress={openInOpenStreetMap}>
          <Ionicons name="map-outline" size={18} color="#1a73e8" />
          <Text style={styles.osmButtonText}>Ver mapa (OpenStreetMap)</Text>
        </Pressable>

        <Pressable style={styles.mapsButton} onPress={openInGoogleMaps}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.mapsButtonText}>Abrir en Google Maps</Text>
        </Pressable>
      </View>

      {mode === "select" && (
        <Pressable style={styles.selectButton} onPress={handleSelectStore}>
          <Text style={styles.selectButtonText}>Seleccionar esta tienda</Text>
        </Pressable>
      )}

      <View style={styles.sectionMuted}>
        <Text style={styles.mutedText}>
          Próximamente: horarios, notas y productos asociados
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    fontSize: 15,
    color: "#666",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  name: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginRight: 12,
  },

  section: {
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },

  sectionText: {
    fontSize: 15,
    color: "#111",
  },

  mapContainer: {
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },

  mapPlaceholder: {
    height: 180,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    color: "#777",
  },

  osmButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef4ff",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  osmButtonText: {
    marginLeft: 8,
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "600",
  },

  mapsButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    borderRadius: 8,
  },

  mapsButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  selectButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  selectButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  sectionMuted: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
  },

  mutedText: {
    color: "#666",
    fontSize: 13,
  },
});
