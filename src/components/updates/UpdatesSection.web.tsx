import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { SectionTitle } from "@/components/SectionTitle";
import { useTheme } from "@/hooks/useTheme";

/**
 * Web build of the updates card. Over-the-air updates are a native-only
 * feature, and this file keeps `expo-updates` out of the web bundle.
 */
export function UpdatesSection() {
  const { colors } = useTheme();

  return (
    <>
      <SectionTitle icon="cloud-download" title="Updates" />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="cloud-offline" size={18} color={colors.textFaint} />
          </View>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Over-the-air updates apply to the Android app only. Open Budgeter on
            your phone and check Settings to update.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
