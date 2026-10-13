import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  value: number;
  limit: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, limit, color, height = 8 }: Props) {
  const { colors } = useTheme();
  const over = limit > 0 && value > limit;
  const percent = limit > 0 ? Math.min(100, (value / limit) * 100) : 0;
  const fillColor = over ? colors.expense : color ?? colors.primary;

  return (
    <View
      style={[styles.track, { backgroundColor: colors.inputBg, height }]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            width: `${percent}%`,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: {},
});