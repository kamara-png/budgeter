import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import { ALL_SIMS } from "@/utils/sims";

interface Props {
  value: string;
  onChange: (simId: string) => void;
  includeAll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function SimChips({ value, onChange, includeAll = false, contentStyle }: Props) {
  const { colors } = useTheme();
  const sims = useStore((s) => s.sims);
  if (sims.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, contentStyle]}
    >
      {includeAll ? (
        <Chip
          label="All SIMs"
          active={value === ALL_SIMS}
          color={colors.primary}
          onPress={() => onChange(ALL_SIMS)}
        />
      ) : null}
      {sims.map((sim) => (
        <Chip
          key={sim.id}
          label={sim.label}
          active={value === sim.id}
          color={sim.color}
          dot={sim.color}
          onPress={() => onChange(sim.id)}
        />
      ))}
    </ScrollView>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  color: string;
  dot?: string;
  onPress: () => void;
}

function Chip({ label, active, color, dot, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? color : colors.inputBg,
          borderColor: colors.border,
        },
      ]}
    >
      {dot ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: active ? "#FFFFFF" : dot },
          ]}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.chipText,
          { color: active ? "#FFFFFF" : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 140,
  },
});
