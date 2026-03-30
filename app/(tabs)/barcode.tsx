import { BarcodeScanner } from "@/src/components/scanner/BarcodeScanner";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function BarcodeScreen() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <BarcodeScanner
        active={true}
        statusMessage="Escanea un código de barras"
        statusColor="#2563eb"
        hideScanArea={false}
        onScanned={({ data }) => {
          if (scanned) return;

          const normalized = data.replace(/\D/g, "");

          if (normalized.length !== 13) return;

          setScanned(true);
          setBarcode(normalized);

          setTimeout(() => setScanned(false), 1500);
        }}
        onCancel={() => router.back()}
      />
      {barcode && (
        <View
          style={{
            position: "absolute",
            bottom: 100,
            alignSelf: "center",
            backgroundColor: "white",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>Código:</Text>
          <Text>{barcode}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
