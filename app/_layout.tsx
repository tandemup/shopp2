import DialogProvider from "@/src/components/ui/dialog/DialogProvider";
import { LocationProvider } from "@/src/context/LocationContext";
import { ThemeProvider } from "@/src/hooks/useTheme";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocationProvider>
          <DialogProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />

              <Stack.Screen name="item/[id]" options={{ headerShown: true }} />

              <Stack.Screen
                name="(modals)"
                options={{ presentation: "modal" }}
              />
            </Stack>
          </DialogProvider>
        </LocationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
