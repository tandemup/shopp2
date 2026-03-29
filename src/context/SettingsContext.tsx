import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// ==============================
// Types
// ==============================

export type CurrencyCode = "EUR" | "USD" | "GBP";

type Settings = {
  defaultCurrency: CurrencyCode;
};

type SettingsContextType = {
  settings: Settings;
  setDefaultCurrency: (currency: CurrencyCode) => void;
  isLoaded: boolean;
};

// ==============================
// Consts
// ==============================

const STORAGE_KEY = "app_settings";

const DEFAULT_SETTINGS: Settings = {
  defaultCurrency: "EUR",
};

// ==============================
// Context
// ==============================

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

// ==============================
// Provider
// ==============================

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // ==============================
  // Load from storage
  // ==============================

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (raw) {
          const parsed = JSON.parse(raw);

          // 🔒 harden against corrupt data
          const safe: Settings = {
            defaultCurrency:
              parsed?.defaultCurrency ?? DEFAULT_SETTINGS.defaultCurrency,
          };

          setSettings(safe);
        }
      } catch (e) {
        console.warn("Settings load failed", e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // ==============================
  // Persist
  // ==============================

  useEffect(() => {
    if (!isLoaded) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch((e) =>
      console.warn("Settings save failed", e),
    );
  }, [settings, isLoaded]);

  // ==============================
  // Actions
  // ==============================

  const setDefaultCurrency = (currency: CurrencyCode) => {
    setSettings((prev) => ({
      ...prev,
      defaultCurrency: currency,
    }));
  };

  // ==============================
  // Value
  // ==============================

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setDefaultCurrency,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ==============================
// Hook
// ==============================

export function useSettings() {
  const ctx = useContext(SettingsContext);

  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }

  return ctx;
}
