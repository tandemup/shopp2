import BarcodeScanner from "@/src/components/scanner/BarcodeScanner";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, SafeAreaView, Text, View } from "react-native";

export default function BarcodeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState(false);

  const normalizeBarcode = (data: string) => {
    const digits = data.replace(/\D/g, "");

    if (digits.length === 13) return digits;
    if (digits.length === 12) return "0" + digits;

    return null;
  };

  const copyBarcode = async (code: string) => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
  };

  const openBrowser = async (code: string) => {
    const url = `https://www.google.com/search?q=${code}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return;
    await Linking.openURL(url);
  };

  const BarcodeInfoCard = ({ barcode }: { barcode: string }) => {
    return (
      <View
        style={{
          position: "absolute",
          bottom: 120,
          alignSelf: "center",
          backgroundColor: "white",
          padding: 16,
          borderRadius: 10,
          minWidth: 240,
        }}
      >
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
          EAN-13 detectado:
        </Text>

        <Text style={{ fontSize: 20, marginTop: 6 }}>{barcode}</Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Pressable
            onPress={() => openBrowser(barcode)}
            style={{
              backgroundColor: "#2563eb",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Buscar</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setBarcode("");
              setScanned(false);
            }}
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
            onPress={() => copyBarcode(barcode)}
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

          if (id) {
            router.replace({
              pathname: "/item/[id]",
              params: {
                id,
                scannedBarcode: normalized,
              },
            });
          }
        }}
        onCancel={() => router.back()}
      />

      {scanned && barcode && !id && <BarcodeInfoCard barcode={barcode} />}
    </SafeAreaView>
  );
}
