import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BarcodeReaderWeb() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [barcodeType, setBarcodeType] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);

  function handleBarcodeScanned({ type, data }) {
    if (scanned) return;

    setScanned(true);
    setBarcode(data);
    setBarcodeType(type);

    console.log("Código detectado en web:", { type, data });
  }

  function scanAgain() {
    setBarcode("");
    setBarcodeType("");
    setScanned(false);
  }

  if (!permission) {
    return <LoadingScreen />;
  }

  if (!permission.granted) {
    return <PermissionScreen requestPermission={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={{ barcodeTypes: ["ean13"] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <ScannerOverlay
        engine="expo-camera · web"
        barcode={barcode}
        barcodeType={barcodeType}
        scanned={scanned}
        onScanAgain={scanAgain}
        torchEnabled={torchEnabled}
        onToggleTorch={() => setTorchEnabled((current) => !current)}
      />
    </View>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.centeredContainer}>
      <StatusBar style="dark" />
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Cargando la cámara...</Text>
    </SafeAreaView>
  );
}

function PermissionScreen({ requestPermission }) {
  return (
    <SafeAreaView style={styles.centeredContainer}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Permiso de cámara</Text>
      <Text style={styles.message}>
        Necesitamos utilizar la cámara para leer el código EAN-13 del producto.
      </Text>
      <Pressable style={styles.primaryButton} onPress={requestPermission}>
        <Text style={styles.primaryButtonText}>Permitir acceso</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function ScannerOverlay({
  engine,
  barcode,
  barcodeType,
  scanned,
  onScanAgain,
  torchEnabled,
  onToggleTorch,
}) {
  return (
    <SafeAreaView style={styles.overlay} edges={["top", "right", "bottom", "left"]}>
      <View style={styles.topPanel}>
        <Text style={styles.overlayTitle}>Escanear producto</Text>
        <Text style={styles.overlaySubtitle}>
          Sitúa el código EAN-13 dentro del recuadro
        </Text>
        <Text style={styles.engineText}>{engine}</Text>
      </View>

      <View style={styles.scannerFrame}>
        <View style={styles.scanLine} />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      <View style={styles.bottomPanel}>
        {scanned ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Código leído</Text>
            <Text selectable style={styles.resultValue}>{barcode}</Text>
            <Text style={styles.resultType}>{barcodeType}</Text>
            <Pressable style={styles.primaryButton} onPress={onScanAgain}>
              <Text style={styles.primaryButtonText}>Escanear otro producto</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.waitingText}>Esperando código de barras...</Text>
        )}

        <Pressable style={styles.secondaryButton} onPress={onToggleTorch}>
          <Text style={styles.secondaryButtonText}>
            {torchEnabled ? "Apagar linterna" : "Encender linterna"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const FRAME_WIDTH = 310;
const FRAME_HEIGHT = 150;
const CORNER_SIZE = 36;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  loadingText: { marginTop: 14, fontSize: 16, color: "#555555" },
  title: {
    marginBottom: 12,
    fontSize: 24,
    fontWeight: "700",
    color: "#202124",
    textAlign: "center",
  },
  message: {
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 23,
    color: "#5f6368",
    textAlign: "center",
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  topPanel: { alignItems: "center" },
  overlayTitle: { fontSize: 25, fontWeight: "700", color: "#ffffff", textAlign: "center" },
  overlaySubtitle: { marginTop: 8, fontSize: 15, color: "#ffffff", textAlign: "center" },
  engineText: { marginTop: 7, fontSize: 12, color: "#d1fae5", textAlign: "center" },
  scannerFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  scanLine: {
    position: "absolute",
    top: FRAME_HEIGHT / 2,
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: "#22c55e",
  },
  corner: { width: CORNER_SIZE, height: CORNER_SIZE, position: "absolute", borderColor: "#ffffff" },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4 },
  bottomPanel: { width: "100%", alignItems: "center", gap: 12 },
  resultCard: {
    width: "100%",
    maxWidth: 390,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    gap: 8,
  },
  resultLabel: { fontSize: 14, color: "#4b5563" },
  resultValue: { fontSize: 23, fontWeight: "700", color: "#111827" },
  resultType: { fontSize: 12, color: "#6b7280" },
  waitingText: { fontSize: 16, color: "#ffffff", textAlign: "center" },
  primaryButton: {
    marginTop: 8,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 18,
    backgroundColor: "#2563eb",
  },
  primaryButtonText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
});
