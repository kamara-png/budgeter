import { useColorScheme } from "react-native";
import { buildAccentTheme, isAccentKey, type ThemeColors } from "@/constants/theme";
import { useStore } from "@/store/useStore";

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

export function useTheme(): Theme {
  const themeMode = useStore((s) => s.themeMode);
  const storedAccent = useStore((s) => s.accent);
  const system = useColorScheme();
  const isDark = themeMode === "system" ? system === "dark" : themeMode === "dark";
  // Guard against legacy hex accents persisted by older versions.
  const accent = isAccentKey(storedAccent) ? storedAccent : "blue";
  return {
    isDark,
    colors: buildAccentTheme(accent, isDark),
  };
}
