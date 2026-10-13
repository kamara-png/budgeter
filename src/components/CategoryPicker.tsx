import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryPicker({ categories, selectedId, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {categories.map((cat) => {
        const selected = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={styles.item}
          >
            <View
              style={[
                styles.circle,
                { backgroundColor: `${cat.color}26`, borderColor: colors.border },
                selected && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <Ionicons name={cat.icon} size={22} color={cat.color} />
            </View>
            <Text
              numberOfLines={2}
              style={[
                styles.label,
                { color: selected ? colors.text : colors.textSecondary },
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
  },
  item: {
    width: "25%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
    maxWidth: "90%",
  },
});