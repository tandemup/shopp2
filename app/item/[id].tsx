import UNITS from "../../data/units.json";
import { alert, confirm } from "../../src/components/ui/dialog/dialog";
import { PROMOTIONS } from "../../src/constants/promotions";
import { useListsStore } from "../../src/store/lists/useListsStore";
import type { Promotion } from "../../src/types/Promotion";
import { formatCurrency } from "../../src/utils/currency";
import { isSamePromotion } from "../../src/utils/pricing/isSamePromotion";
import {
  calculateItemPrice,
  normalizePromotion,
  validatePromotion,
} from "../../src/utils/pricing/pricing";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const parseNumber = (v: string, fallback = 0) => {
  const n = Number((v || "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
};

const sanitizeNumberInput = (v: string) => {
  return v
    .replace(",", ".")
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1");
};

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.headerIcon} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.headerSpacer} />
    </View>
  );
}

function CardNombreBarcode({
  nameItem,
  barcodeItem,
  onChangeName,
  onChangeBarcode,
  onScanner,
  onSearch,
}: {
  nameItem: string;
  barcodeItem: string;
  onChangeName: (text: string) => void;
  onChangeBarcode: (text: string) => void;
  onScanner: () => void;
  onSearch: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Nombre</Text>

      <TextInput
        style={styles.input}
        value={nameItem}
        onChangeText={onChangeName}
        placeholder="Nombre del producto"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={[styles.label, styles.sectionGap]}>Código de barras</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex]}
          value={barcodeItem}
          onChangeText={onChangeBarcode}
          placeholder="EAN-13"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable style={styles.iconButton} onPress={onScanner}>
          <Ionicons name="barcode-outline" size={18} color="#374151" />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={onSearch}>
          <Ionicons name="search-outline" size={18} color="#374151" />
        </Pressable>
      </View>
    </View>
  );
}

function Unidades({
  qty,
  price,
  unit,
  onChangeQty,
  onChangePrice,
  onChangeUnit,
}: {
  qty: string;
  price: string;
  unit: string;
  onChangeQty: (text: string) => void;
  onChangePrice: (text: string) => void;
  onChangeUnit: (unit: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Unidad</Text>

      <View style={styles.unitRow}>
        {UNITS.map((u) => {
          const selected = unit === u;

          return (
            <Pressable
              key={u}
              style={[styles.pill, selected && styles.pillActive]}
              onPress={() => onChangeUnit(u)}
            >
              <Text
                style={[styles.pillText, selected && styles.pillTextActive]}
              >
                {u}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.rowSpace, styles.sectionGapLarge]}>
        <View style={styles.flex}>
          <Text style={styles.label}>Cantidad ({unit})</Text>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={onChangeQty}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.flex}>
          <Text style={styles.label}>Precio ({unit})</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={onChangePrice}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>
    </View>
  );
}

function PromotionList({
  quantity,
  unitPrice,
  selectedPromo,
  onSelect,
}: {
  quantity: number;
  unitPrice: number;
  selectedPromo: Promotion;
  onSelect: (p: Promotion) => void;
}) {
  return (
    <View style={styles.promoWrap}>
      {PROMOTIONS.map((option) => {
        const promo = normalizePromotion(option.promo);
        const validation = validatePromotion(promo, quantity, unitPrice);

        const disabled = !validation.valid;
        const selected = isSamePromotion(selectedPromo, promo);

        return (
          <Pressable
            key={option.id}
            onPress={() => {
              if (disabled) return;
              onSelect(promo);
            }}
            disabled={disabled}
            style={[
              styles.promoChip,
              selected && styles.promoChipSelected,
              disabled && styles.promoChipDisabled,
            ]}
          >
            <Text
              style={[
                styles.promoChipText,
                selected && styles.promoChipTextSelected,
                disabled && styles.promoChipTextDisabled,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Ofertas({
  quantity,
  unitPrice,
  selectedPromo,
  onSelect,
}: {
  quantity: number;
  unitPrice: number;
  selectedPromo: Promotion;
  onSelect: (p: Promotion) => void;
}) {
  const promoValidation = validatePromotion(selectedPromo, quantity, unitPrice);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Ofertas</Text>

      <PromotionList
        quantity={quantity}
        unitPrice={unitPrice}
        selectedPromo={selectedPromo}
        onSelect={onSelect}
      />

      {!promoValidation.valid && (
        <View style={styles.offerWarningBox}>
          <Text style={styles.offerWarning}>
            {promoValidation.message ?? "Oferta no válida"}
          </Text>
        </View>
      )}
    </View>
  );
}

function Summary({
  base,
  savings,
  total,
}: {
  base: number;
  savings: number;
  total: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Resumen</Text>

      <Text style={styles.summaryLine}>Base: {formatCurrency(base)}</Text>

      <Text style={styles.summarySavings}>
        Ahorro: {formatCurrency(savings)}
      </Text>

      <View style={styles.summaryTotalRow}>
        <Text style={styles.summaryTotalLabel}>Total</Text>
        <Text style={styles.summaryTotalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

export default function ItemDetailScreen() {
  const { id, scannedBarcode } = useLocalSearchParams<{
    id?: string;
    scannedBarcode?: string;
  }>();

  const router = useRouter();

  const hasHydrated = useListsStore((s) => s.hasHydrated);
  const findItemById = useListsStore((s) => s.findItemById);
  const updateItem = useListsStore((s) => s.updateItem);
  const removeItem = useListsStore((s) => s.removeItem);

  const found = id ? findItemById(id) : null;
  const item = found?.item;
  const list = found?.list;

  const [nameItem, setNameItem] = useState("");
  const [barcodeItem, setBarcodeItem] = useState("");
  const [unit, setUnit] = useState("u");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("0");
  const [promo, setPromo] = useState<Promotion>({ type: "none" });

  useEffect(() => {
    if (!item) return;

    setNameItem(item.name ?? "");
    setBarcodeItem(item.barcode ?? "");
    setUnit(item.unit ?? "u");
    setQty(String(item.quantity ?? 1));
    setPrice(String(item.unitPrice ?? 0));
    setPromo(normalizePromotion(item.promo));
  }, [item]);

  useEffect(() => {
    if (scannedBarcode) {
      setBarcodeItem(scannedBarcode);
    }
  }, [scannedBarcode]);

  const quantity = parseNumber(qty, 1);
  const unitPrice = parseNumber(price, 0);
  const safePromo = useMemo(() => normalizePromotion(promo), [promo]);

  const priceResult = useMemo(() => {
    return calculateItemPrice({ quantity, unitPrice, promo: safePromo });
  }, [quantity, unitPrice, safePromo]);

  if (!hasHydrated) {
    return null;
  }

  if (!item || !list) {
    return (
      <SafeAreaView style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Producto no encontrado</Text>

        <Pressable style={styles.notFoundButton} onPress={() => router.back()}>
          <Text style={styles.notFoundButtonText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleScanner = () => {
    router.push({
      pathname: "/barcode",
      params: {
        id: item.id,
      },
    });
  };

  const handleSearch = () => {
    if (!barcodeItem.trim()) return;

    const url = `https://www.google.com/search?q=${barcodeItem.trim()}`;
    Linking.openURL(url);
  };

  const saveItem = async () => {
    if (!nameItem.trim()) {
      await alert("Nombre requerido", "Introduce un nombre.");
      return;
    }

    updateItem(list.id, item.id, {
      name: nameItem.trim(),
      barcode: barcodeItem.trim(),
      unit,
      quantity,
      unitPrice,
      promo: safePromo,
    });

    router.back();
  };

  const deleteItem = async () => {
    const r = await confirm("Eliminar", "¿Seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive" },
    ]);

    if (r === 1) {
      removeItem(list.id, item.id);
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Editar producto" onBack={() => router.back()} />

          <CardNombreBarcode
            nameItem={nameItem}
            barcodeItem={barcodeItem}
            onChangeName={setNameItem}
            onChangeBarcode={setBarcodeItem}
            onScanner={handleScanner}
            onSearch={handleSearch}
          />

          <Unidades
            qty={qty}
            price={price}
            unit={unit}
            onChangeQty={(text) => setQty(sanitizeNumberInput(text))}
            onChangePrice={(text) => setPrice(sanitizeNumberInput(text))}
            onChangeUnit={setUnit}
          />

          <Ofertas
            quantity={quantity}
            unitPrice={unitPrice}
            selectedPromo={safePromo}
            onSelect={setPromo}
          />

          <Summary
            base={priceResult.baseTotal}
            savings={priceResult.savings}
            total={priceResult.total}
          />

          {!priceResult.valid && (
            <Text style={styles.warning}>
              {priceResult.reason || "Oferta no válida"}
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.saveButton} onPress={saveItem}>
              <Text style={styles.saveText}>Guardar cambios</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={deleteItem}>
              <Text style={styles.deleteText}>Eliminar producto</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },

  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 28,
  },

  notFound: {
    flex: 1,
    backgroundColor: "#f2f2f7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },

  notFoundTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  notFoundButton: {
    backgroundColor: "#2f6df6",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  notFoundButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  headerSpacer: {
    width: 28,
    height: 28,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  sectionGap: {
    marginTop: 14,
  },

  sectionGapLarge: {
    marginTop: 16,
  },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  rowSpace: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },

  pillActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  pillTextActive: {
    color: "#fff",
  },

  promoWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },

  promoChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },

  promoChipSelected: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },

  promoChipDisabled: {
    opacity: 0.45,
  },

  promoChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  promoChipTextSelected: {
    color: "#92400e",
  },

  promoChipTextDisabled: {
    color: "#9ca3af",
  },

  offerWarningBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
  },

  offerWarning: {
    color: "#9a3412",
    fontSize: 13,
    fontWeight: "500",
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  summaryLine: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },

  summarySavings: {
    fontSize: 14,
    color: "#16a34a",
    fontWeight: "600",
    marginBottom: 10,
  },

  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  warning: {
    color: "#b45309",
    fontSize: 13,
    fontWeight: "600",
    marginTop: -4,
  },

  actions: {
    gap: 10,
    marginTop: 4,
  },

  saveButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  deleteButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 15,
  },
});
