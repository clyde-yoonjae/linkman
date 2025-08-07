import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage를 위한 커스텀 훅
export const useAsyncStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(key);
        if (storedValue !== null) {
          setValue(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error("AsyncStorage error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadValue();
  }, [key]);

  const setStoredValue = async (newValue: T) => {
    try {
      setValue(newValue);
      await AsyncStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error("AsyncStorage error:", error);
    }
  };

  return [value, setStoredValue, loading] as const;
};
