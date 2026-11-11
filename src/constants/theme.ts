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

/**
 * Neutral base palettes (inspired by Tendo). Backgrounds and surfaces are
 * softly tinted toward the chosen accent at runtime; text stays neutral for
 * readability in every mode.
 */
const darkColors: ThemeColors = {
  background: "#17212b",
  card: "#1f2c38",
  border: "#2e3d4b",
  inputBg: "#293844",
  text: "#e8e6ec",
  textSecondary: "#98a4b3",
  textFaint: "#6d7c8b",
  primary: "#70b9ee",
  expense: "#fb414a",
  income: "#7bbfa8",
  danger: "#fb414a",
  overlay: "rgba(0, 0, 0, 0.6)",
};

const lightColors: ThemeColors = {
  background: "#f4f6f8",
  card: "#ffffff",
  border: "#d6dde4",
  inputBg: "#e8edf2",
  text: "#17212b",
  textSecondary: "#5f6d7a",
  textFaint: "#93a1ae",
  primary: "#2f8fd0",
  expense: "#d63840",
  income: "#2f8578",
  danger: "#d63840",
  overlay: "rgba(15, 23, 42, 0.45)",
};

export type AccentKey = "blue" | "teal" | "amber" | "rose" | "purple" | "green";

export const ACCENTS: { key: AccentKey; label: string; dark: string; light: string }[] = [
  { key: "blue", label: "Blue", dark: "#70b9ee", light: "#2f8fd0" },
  { key: "teal", label: "Teal", dark: "#5bd0d6", light: "#1f9ca2" },
  { key: "amber", label: "Amber", dark: "#e8a33d", light: "#b5792f" },
  { key: "rose", label: "Rose", dark: "#e88a97", light: "#b05563" },
  { key: "purple", label: "Purple", dark: "#a99ad9", light: "#6f5fae" },
  { key: "green", label: "Green", dark: "#9ac48f", light: "#4f8a3f" },
];

export const DEFAULT_ACCENT: AccentKey = "blue";

export function isAccentKey(value: string): value is AccentKey {
  return ACCENTS.some((a) => a.key === value);
}

export function accentColor(key: string, isDark: boolean): string {
  const preset = ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
  return isDark ? preset.dark : preset.light;
}

type Rgb = [number, number, number];

const hexToRgb = (hex: string): Rgb => {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const mix = (a: Rgb, b: Rgb, ratio: number): Rgb =>
  a.map((v, i) => Math.round(v + (b[i] - v) * ratio)) as Rgb;

/** Gently tint a neutral color toward the accent. Low ratios keep it calm. */
const tint = (base: string, accent: string, ratio: number) =>
  rgbToHex(mix(hexToRgb(base), hexToRgb(accent), ratio));

/**
 * Derive the full theme from the chosen accent: backgrounds and surfaces get a
 * soft tint toward the hue while text and status colors stay fixed.
 */
export function buildAccentTheme(accentKey: string, isDark: boolean): ThemeColors {
  const base = isDark ? darkColors : lightColors;
  const accent = accentColor(accentKey, isDark);
  return {
    ...base,
    background: tint(base.background, accent, 0.07),
    card: tint(base.card, accent, 0.06),
    border: tint(base.border, accent, 0.1),
    inputBg: tint(base.inputBg, accent, 0.07),
    primary: accent,
  };
}

/** Static hex swatches for coloring SIM cards (works in both modes). */
export const SIM_COLORS: { name: string; value: string }[] = [
  { name: "Blue", value: "#70b9ee" },
  { name: "Teal", value: "#5bd0d6" },
  { name: "Amber", value: "#e8a33d" },
  { name: "Rose", value: "#e88a97" },
  { name: "Purple", value: "#a99ad9" },
  { name: "Green", value: "#9ac48f" },
];

export const DEFAULT_SIM_COLOR = SIM_COLORS[0].value;

export const currency = {
  symbol: "$",
  code: "USD",
};
