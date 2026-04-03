import BarcodeScanner from "@/src/components/scanner/BarcodeScanner";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

type ProductInfo = {
  name?: string;
  image?: string;
};

type BarcodeInfoCardProps = {
  barcode: string;
  product: ProductInfo | null;
  openingBrowser: boolean;
  onSearch: () => void;
  onResume: () => void;
  onCopy: () => void;
};

function BarcodeInfoCard({
  barcode,
  product,
  openingBrowser,
  onSearch,
  onResume,
  onCopy,
}: BarcodeInfoCardProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 120,
        alignSelf: "center",
        backgroundColor: "rgba(255,255,255,0.5)",
        padding: 16,
        borderRadius: 10,
        minWidth: 260,
        alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>
        Código detectado:
      </Text>

      <Text style={{ fontSize: 20, marginTop: 6 }}>{barcode}</Text>

      {product?.image && (
        <Image
          source={{ uri: product.image }}
          style={{
            width: 120,
            height: 120,
            marginTop: 12,
            borderRadius: 8,
          }}
          resizeMode="contain"
        />
      )}

      {product?.name && (
        <Text
          style={{
            marginTop: 10,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {product.name}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Pressable
          onPress={onSearch}
          disabled={openingBrowser}
          style={{
            backgroundColor: openingBrowser ? "#93c5fd" : "#2563eb",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            opacity: openingBrowser ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {openingBrowser ? "Abriendo..." : "Buscar"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onResume}
          style={{
            backgroundColor: "#111827",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Reanudar</Text>
        </Pressable>

        <Pressable
          onPress={onCopy}
          style={{
            backgroundColor: "#16a34a",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Copiar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function BarcodeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState(false);
  const [openingBrowser, setOpeningBrowser] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);

  // 🔴 control de cancelación
  const isCancellingRef = useRef(false);

  // 🔴 abort controller real
  const abortControllerRef = useRef<AbortController | null>(null);

  function normalizeBarcode(code: string): string | null {
    const clean = code.replace(/\D/g, "");

    if (clean.length === 13) return clean;
    if (clean.length === 8) return clean;

    return null;
  }

  const resetScanState = () => {
    setBarcode("");
    setScanned(false);
    setProduct(null);
  };

  // 🔴 salida segura
  const handleCancel = () => {
    isCancellingRef.current = true;

    // cancelar fetch en curso
    abortControllerRef.current?.abort();

    // limpiar estado
    setOpeningBrowser(false);
    resetScanState();

    router.back();
  };

  const copyBarcode = async (code: string) => {
    if (!code || isCancellingRef.current) return;

    await Clipboard.setStringAsync(code);

    if (!id) {
      handleCancel();
    }
  };

  const openBrowser = async (code: string) => {
    if (!code || openingBrowser || isCancellingRef.current) return;

    try {
      setOpeningBrowser(true);

      const url = `https://www.google.com/search?q=${encodeURIComponent(code)}`;
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen || isCancellingRef.current) return;

      await Linking.openURL(url);
    } finally {
      if (!isCancellingRef.current) {
        setOpeningBrowser(false);
      }
    }
  };

  // 🔎 fetch con cancelación real
  async function fetchProduct(barcode: string): Promise<ProductInfo | null> {
    try {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { signal: controller.signal },
      );

      if (isCancellingRef.current) return null;

      const json = await res.json();

      if (isCancellingRef.current) return null;

      if (json.status === 1) {
        return {
          name: json.product.product_name,
          image: json.product.image_url,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <BarcodeScanner
        active={true}
        statusMessage="Escanea un código de barras"
        statusColor="#2563eb"
        onStartScanning={() => {
          isCancellingRef.current = false;
          resetScanState();
        }}
        onScanned={async ({ data }: { data: string; type: string }) => {
          if (scanned || isCancellingRef.current) return;

          const normalized = normalizeBarcode(data);
          if (!normalized) return;

          setScanned(true);
          setBarcode(normalized);

          const productData = await fetchProduct(normalized);

          if (isCancellingRef.current) return;

          setProduct(productData);

          if (id) {
            router.replace({
              pathname: "/item/[id]",
              params: {
                id,
                scannedBarcode: normalized,
                productName: productData?.name ?? "",
                productImage: productData?.image ?? "",
              },
            });
          }
        }}
        onCancel={handleCancel}
      />

      {scanned && barcode && !id && (
        <BarcodeInfoCard
          barcode={barcode}
          product={product}
          openingBrowser={openingBrowser}
          onSearch={() => openBrowser(barcode)}
          onResume={resetScanState}
          onCopy={() => copyBarcode(barcode)}
        />
      )}
    </SafeAreaView>
  );
}
