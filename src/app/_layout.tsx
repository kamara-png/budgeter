import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/hooks/useTheme";

export default function RootLayout() {
  const { isDark, colors } = useTheme();

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.expense,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          animation: "none",
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/[id]"
          options={{
            presentation: "modal",
            animation: "none",
            contentStyle: { backgroundColor: colors.background },
            title: "Transaction",
          }}
        />
        <Stack.Screen
          name="mpesa"
          options={{
            presentation: "modal",
            animation: "none",
            contentStyle: { backgroundColor: colors.background },
            title: "Import from M-Pesa",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
