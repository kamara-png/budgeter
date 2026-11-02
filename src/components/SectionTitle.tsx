import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { IconName } from "@/types";

interface Props {
  icon: IconName;
  title: string;
}

/** Uppercase section label used above each Settings card. */
export function SectionTitle({ icon, title }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
