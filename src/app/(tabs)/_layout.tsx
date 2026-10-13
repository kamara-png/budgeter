import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Tabs } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, type ColorValue } from "react-native";
import { CalculatorModal } from "@/components/CalculatorModal";
import { useTheme } from "@/hooks/useTheme";
import type { IconName } from "@/types";

function makeTabIcon(name: IconName) {
  return function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
  },
});

export default function TabsLayout() {
  const { colors } = useTheme();
  const [showCalculator, setShowCalculator] = useState(false);

  const useAmount = (value: number) =>
    router.push({
      pathname: "/transaction/[id]",
      params: { id: "new", amount: String(value) },
    });

  return (
    <>
      <Tabs
        screenOptions={{
          animation: "none",
          headerShown: true,
          sceneStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: "700" },
          headerRight: () => (
            <Pressable onPress={() => setShowCalculator(true)} hitSlop={10} style={{ paddingRight: 16 }}>
              <Ionicons name="calculator-outline" size={22} color={colors.text} />
            </Pressable>
          ),
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textFaint,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Budgeter",
            tabBarIcon: makeTabIcon("wallet"),
            headerTitle: () => (
              <View style={styles.headerTitle}>
                <Image
                  source={require("../../../assets/header-logo.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.headerTitleText, { color: colors.text }]}>Budgeter</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen name="transactions" options={{ title: "Transactions", tabBarIcon: makeTabIcon("card") }} />
        <Tabs.Screen name="stats" options={{ title: "Stats", tabBarIcon: makeTabIcon("pie-chart") }} />
        <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: makeTabIcon("settings") }} />
      </Tabs>

      {showCalculator ? (
        <CalculatorModal
          visible
          onClose={() => setShowCalculator(false)}
          onUse={useAmount}
          useLabel="Add as transaction"
        />
      ) : null}
    </>
  );
}
