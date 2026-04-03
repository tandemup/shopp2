import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ZoomLevel = {
  label: string;
  value: number;
};

type BarcodeScannerProps = {
  onScanned?: (payload: { type: string; data: string }) => void;
  onCancel?: () => void;
  onStartScanning?: () => void;
  active?: boolean;
  statusMessage?: string;
  statusColor?: string;
};

const zoomLevels: ZoomLevel[] = [
  { label: "1x", value: 0 },
  { label: "1.2x", value: 0.2 },
  { label: "1.5x", value: 0.5 },
];

const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e"];

/* 🔧 Helper seguro */
const getZoomValue = (index: number) => {
  return zoomLevels[index].value ?? zoomLevels[0].value;
};

export default function BarcodeScanner({
  onScanned,
  onCancel,
  onStartScanning,
  active = true,
  statusMessage = "",
  statusColor = "#2563eb",
}: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanningEnabled, setScanningEnabled] = useState(false);
  const [torch, setTorch] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(1);

  const scanLockRef = useRef(false);
  const zoom = getZoomValue(zoomIndex);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const resetScannerState = () => {
    scanLockRef.current = false;
    setScanningEnabled(false);
    setTorch(false);
    setZoomIndex(1);
  };

  const handleBarcodeScanned = ({
    data,
    type,
  }: {
    data: string;
    type: string | number;
  }) => {
    if (!active || !scanningEnabled || scanLockRef.current) return;

    scanLockRef.current = true;
    setScanningEnabled(false);
    onScanned?.({ type: String(type), data });
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Solicitando permiso de cámara…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: "center", marginBottom: 12 }}>
          No se pudo acceder a la cámara.
        </Text>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: "#2563eb" }]}
          onPress={() => requestPermission()}
        >
          <Text style={styles.primaryBtnText}>Permitir cámara</Text>
        </Pressable>

        <Pressable
          style={[
            styles.primaryBtn,
            { backgroundColor: "#ef4444", marginTop: 10 },
          ]}
          onPress={onCancel}
        >
          <Text style={styles.primaryBtnText}>Cerrar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch}
        zoom={zoom}
        barcodeScannerSettings={{
          barcodeTypes: BARCODE_TYPES,
        }}
        onBarcodeScanned={
          active && scanningEnabled ? handleBarcodeScanned : undefined
        }
      />

      {statusMessage ? (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusColor,
            },
          ]}
        >
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      ) : null}

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => setTorch((prev) => !prev)}
        >
          <MaterialCommunityIcons
            name={torch ? "flashlight" : "flashlight-off"}
            size={26}
            color="#fff"
          />
        </Pressable>

        <Pressable
          style={styles.iconButton}
          onPress={() => setZoomIndex((prev) => (prev + 1) % zoomLevels.length)}
        >
          <MaterialCommunityIcons name="magnify-plus" size={26} color="#fff" />
          <Text style={styles.iconButtonText}>
            {zoomLevels[zoomIndex].label}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.scanButton,
            scanningEnabled && styles.scanButtonActive,
          ]}
          onPress={() => {
            if (scanningEnabled) {
              resetScannerState();
              return;
            }

            onStartScanning?.();
            scanLockRef.current = false;
            setScanningEnabled(true);
          }}
        >
          <MaterialCommunityIcons name="barcode-scan" size={24} color="#fff" />
          <Text style={styles.scanButtonText}>
            {scanningEnabled ? "Detener" : "Escanear"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.iconButton}
          onPress={() => {
            resetScannerState();
            onCancel?.();
          }}
        >
          <MaterialCommunityIcons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  statusBadge: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontWeight: "bold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    minWidth: 56,
  },
  iconButtonText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },
  scanButton: {
    minWidth: 120,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanButtonActive: {
    backgroundColor: "#16a34a",
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
