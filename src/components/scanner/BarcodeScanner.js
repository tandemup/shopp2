import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function BarcodeScanner({
  onScanned,
  onCancel,
  onReenable,
  onStartScanning, // 🔥 NUEVO
  active = true,
  statusMessage = "",
  statusColor = "#2563eb",
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanningEnabled, setScanningEnabled] = useState(false);
  const [torch, setTorch] = useState(false);

  // 🔍 Zoom
  const zoomLevels = [0, 0.2, 0.4];
  const [zoomIndex, setZoomIndex] = useState(0);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!permission) requestPermission();
    return () => (mounted.current = false);
  }, [permission]);

  const handleBarcodeScanned = ({ data, type }) => {
    if (!scanningEnabled || !active) return;

    // ✅ solo códigos válidos
    if (type !== "ean13" && type !== "upc_a") return;

    setScanningEnabled(false);

    onScanned?.({ type, data });
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
          style={[styles.primaryBtn, { backgroundColor: "#ef4444" }]}
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
        zoom={zoomLevels[zoomIndex]}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a"],
        }}
        onBarcodeScanned={
          active && scanningEnabled ? handleBarcodeScanned : undefined
        }
      />

      {/* 💬 Mensaje */}
      {statusMessage ? (
        <View
          style={{
            position: "absolute",
            top: 80,
            alignSelf: "center",
            backgroundColor: statusColor,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {statusMessage}
          </Text>
        </View>
      ) : null}

      {/* 🎮 Controles */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: "rgba(0,0,0,0.45)",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {/* 🔦 Linterna */}
        <Pressable
          style={styles.iconButton}
          onPress={() => setTorch((t) => !t)}
        >
          <MaterialCommunityIcons
            name={torch ? "flashlight" : "flashlight-off"}
            size={26}
            color="#fff"
          />
        </Pressable>

        {/* 🔍 Zoom */}
        <Pressable
          style={styles.iconButton}
          onPress={() => setZoomIndex((i) => (i + 1) % zoomLevels.length)}
        >
          <MaterialCommunityIcons name="magnify-plus" size={26} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12 }}>{zoomIndex + 1}x</Text>
        </Pressable>

        {/* 🎯 ESCANEAR */}
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            setScanningEnabled(true);
            onReenable?.(); // 🔥 importante
          }}
        >
          <MaterialCommunityIcons name="barcode" size={26} color="#fff" />
        </Pressable>

        {/* ❌ Cerrar */}
        <Pressable style={styles.iconButton} onPress={onCancel}>
          <MaterialCommunityIcons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
  },
  primaryBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
  },
  primaryBtnText: { color: "#fff", fontWeight: "bold" },
};
