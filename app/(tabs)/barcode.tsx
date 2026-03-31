import BarcodeScanner from "@/src/components/scanner/BarcodeScanner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, SafeAreaView, Text, View } from "react-native";

export default function BarcodeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState(false);

  const normalizeBarcode = (data: string) => {
    const digits = data.replace(/\D/g, "");

    if (digits.length === 13) return digits;

    if (digits.length === 12) return "0" + digits;

    return null;
  };

  const openBrowser = (code: string) => {
    // 🔥 puedes cambiar esto por OpenFoodFacts si quieres
    const url = `https://www.google.com/search?q=${code}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <BarcodeScanner
        active={true}
        statusMessage="Escanea un código de barras"
        statusColor="#2563eb"
        onStartScanning={() => {
          setBarcode("");
          setScanned(false);
        }}
        onScanned={({ data }: { data: string }) => {
          if (scanned) return;

          const normalized = normalizeBarcode(data);
          if (!normalized) return;

          setScanned(true);
          setBarcode(normalized);

          // 🔥 AQUÍ ESTÁ LA CLAVE
          router.replace({
            pathname: "/item/[id]",
            params: {
              id,
              scannedBarcode: normalized,
            },
          });
        }}
        onReenable={() => {
          setScanned(false);
        }}
        onCancel={() => router.back()}
      />

      {/* 📦 Debug visual */}
      {scanned && barcode && (
        <View
          style={{
            position: "absolute",
            bottom: 120,
            alignSelf: "center",
            backgroundColor: "white",
            padding: 16,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
            EAN-13 detectado:
          </Text>
          <Text style={{ fontSize: 20 }}>{barcode}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
