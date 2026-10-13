import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  activeColor?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  activeColor,
}: Props<T>) {
  const { colors } = useTheme();
  const active = activeColor ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBg }]}>
      {options.map((o) => {
        const isActive = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.option, isActive && { backgroundColor: active }]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? "#FFFFFF" : colors.textSecondary },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});