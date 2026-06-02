import { SafeAreaProvider } from "react-native-safe-area-context";
import BarcodeReader from "./src/BarcodeReader";

export default function App() {
  return (
    <SafeAreaProvider>
      <BarcodeReader />
    </SafeAreaProvider>
  );
}
