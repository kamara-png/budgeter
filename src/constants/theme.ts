export interface ThemeColors {
  background: string;
  card: string;
  border: string;
  inputBg: string;
  text: string;
  textSecondary: string;
  textFaint: string;
  primary: string;
  expense: string;
  income: string;
  danger: string;
  overlay: string;
}

export const colors: Record<"light" | "dark", ThemeColors> = {
  light: {
    background: "#F6F7FB",
    card: "#FFFFFF",
    border: "#ECEEF3",
    inputBg: "#F0F1F5",
    text: "#111827",
    textSecondary: "#6B7280",
    textFaint: "#9CA3AF",
    primary: "#4F46E5",
    expense: "#DC2626",
    income: "#059669",
    danger: "#DC2626",
    overlay: "rgba(15, 23, 42, 0.45)",
  },
  dark: {
    background: "#0B1220",
    card: "#151D2E",
    border: "#243149",
    inputBg: "#1B2437",
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    textFaint: "#64748B",
    primary: "#818CF8",
    expense: "#F87171",
    income: "#34D399",
    danger: "#F87171",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

export const currency = {
  symbol: "$",
  code: "USD",
};

export const DEFAULT_ACCENT = "#4F46E5";

export const ACCENT_COLORS: { name: string; value: string }[] = [
  { name: "Indigo", value: "#4F46E5" },
  { name: "Blue", value: "#2563EB" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Cyan", value: "#0891B2" },
  { name: "Teal", value: "#0D9488" },
  { name: "Green", value: "#059669" },
  { name: "Lime", value: "#65A30D" },
  { name: "Amber", value: "#D97706" },
  { name: "Orange", value: "#EA580C" },
  { name: "Red", value: "#DC2626" },
  { name: "Pink", value: "#DB2777" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Slate", value: "#475569" },
];