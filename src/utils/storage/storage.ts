import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const storage = {
  getItem: async (key: string) => {
    if (isWeb) {
      return Promise.resolve(localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    if (isWeb) {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    if (isWeb) {
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};
