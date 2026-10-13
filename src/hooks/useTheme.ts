import { useColorScheme } from "react-native";
import { colors, type ThemeColors } from "@/constants/theme";
import { useStore } from "@/store/useStore";

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

export function useTheme(): Theme {
  const themeMode = useStore((s) => s.themeMode);
  const accent = useStore((s) => s.accent);
  const system = useColorScheme();
  const isDark = themeMode === "system" ? system === "dark" : themeMode === "dark";
  const base = isDark ? colors.dark : colors.light;
  return {
    isDark,
    colors: {
      ...base,
      primary: accent,
    },
  };
}
