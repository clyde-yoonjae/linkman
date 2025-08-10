import { create } from "zustand";
import { COLORS, SIZES } from "../constants";

interface Theme {
  colors: typeof COLORS;
  sizes: typeof SIZES;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

interface ThemeState {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: (theme: Theme) => void;
}

const defaultTheme: Theme = {
  colors: COLORS,
  sizes: SIZES,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: defaultTheme,
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setTheme: (theme) => set({ theme }),
}));

// 편의를 위한 훅
export const useTheme = () => useThemeStore((state) => state.theme);
export const useIsDarkMode = () => useThemeStore((state) => state.isDarkMode);
export const useToggleDarkMode = () =>
  useThemeStore((state) => state.toggleDarkMode);
