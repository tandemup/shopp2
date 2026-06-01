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
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <BarcodeReader />
    </SafeAreaProvider>
  );
}

function BarcodeReader() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);

  function handleBarcodeScanned({ type, data }) {
    if (scanned) {
      return;
    }

    setScanned(true);
    setBarcode(data);

    console.log("Código detectado:", {
      type,
      data,
    });
  }

  function scanAgain() {
    setBarcode("");
    setScanned(false);
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <StatusBar style="dark" />

        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Cargando la cámara...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <StatusBar style="dark" />

        <Text style={styles.title}>Permiso de cámara</Text>

        <Text style={styles.message}>
          Necesitamos utilizar la cámara para leer el código de barras del
          producto.
        </Text>

        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Permitir acceso</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        style={styles.camera}
        facing="back"
        autofocus="off"
        zoom={0.08}
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView
        style={styles.overlay}
        edges={["top", "right", "bottom", "left"]}
      >
        <View style={styles.topPanel}>
          <Text style={styles.overlayTitle}>Escanear producto</Text>

          <Text style={styles.overlaySubtitle}>
            Sitúa el código EAN-13 dentro del recuadro
          </Text>
        </View>

        <View style={styles.scannerFrame}>
          <View style={styles.scanLine} />

          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.bottomPanel}>
          {barcode ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Código leído</Text>

              <Text style={styles.resultValue}>{barcode}</Text>

              <Pressable style={styles.primaryButton} onPress={scanAgain}>
                <Text style={styles.primaryButtonText}>
                  Escanear otro producto
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.waitingText}>
              Esperando código de barras...
            </Text>
          )}

          <Pressable
            style={styles.secondaryButton}
            onPress={() => setTorchEnabled((currentValue) => !currentValue)}
          >
            <Text style={styles.secondaryButtonText}>
              {torchEnabled ? "Apagar linterna" : "Encender linterna"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const FRAME_WIDTH = 310;
const FRAME_HEIGHT = 150;
const CORNER_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },

  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: "#555555",
  },

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

  camera: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },

  topPanel: {
    alignItems: "center",
  },

  overlayTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },

  overlaySubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#ffffff",
    textAlign: "center",
  },

  scannerFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  corner: {
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    position: "absolute",
    borderColor: "#ffffff",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },

  bottomPanel: {
    width: "100%",
    alignItems: "center",
  },

  waitingText: {
    marginBottom: 18,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },

  resultCard: {
    width: "100%",
    maxWidth: 420,
    marginBottom: 14,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
  },

  resultLabel: {
    fontSize: 14,
    color: "#5f6368",
    textAlign: "center",
  },

  resultValue: {
    marginTop: 5,
    marginBottom: 16,
    fontSize: 24,
    fontWeight: "700",
    color: "#202124",
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#1976d2",
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },

  scanLine: {
    position: "absolute",
    top: "50%",
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: "#ff3b30",
  },
});
