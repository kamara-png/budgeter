import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { ChangelogEntry } from "@/utils/updates";

interface Props {
  entry: ChangelogEntry;
}

const GROUPS = [
  { key: "added", label: "Added" },
  { key: "changed", label: "Changed" },
  { key: "fixed", label: "Fixed" },
] as const;

/** Renders the Added / Changed / Fixed lists for one changelog entry. */
export function ChangelogBody({ entry }: Props) {
  const { colors } = useTheme();

  const groups = GROUPS.map((group) => ({
    label: group.label,
    items: entry[group.key] ?? [],
  })).filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.textSecondary }]}>
        No details were written for this update.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <Text style={[styles.label, { color: colors.textFaint }]}>
            {group.label}
          </Text>
          {group.items.map((item) => (
            <View key={item} style={styles.item}>
              <View
                style={[styles.bullet, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.itemText, { color: colors.text }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  group: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
});
