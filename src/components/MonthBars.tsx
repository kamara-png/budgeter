import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export interface BarSeries {
  label: string;
  value: number;
  /** The current period; drawn with brighter emphasis. */
  highlighted?: boolean;
}

interface Props {
  data: BarSeries[];
  height?: number;
  /** Bar fill color; defaults to the accent color. */
  color?: string;
}

/**
 * Minimal month-by-month bar chart, built from plain views. Small enough that
 * it can't break, dark-mode aware, and consistent with ProgressBar styling.
 */
export function MonthBars({ data, height = 150, color }: Props) {
  const { colors } = useTheme();
  const barColor = color ?? colors.primary;
  const max = Math.max(...data.map((b) => Math.max(0, b.value)), 0);

  return (
    <View>
      <View style={[styles.row, { height }]}>
        {data.map((bar, index) => {
          const zero = bar.value <= 0;
          // Zero months show a 4px stub so the column still exists.
          const barHeight = zero
            ? 4
            : Math.max((bar.value / max) * height, 8);
          return (
            <View
              key={`${bar.label}-${index}`}
              style={styles.column}
            >
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: zero ? colors.border : barColor,
                    },
                  ]}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: bar.highlighted ? colors.text : colors.textFaint },
                ]}
              >
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={[styles.baseline, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 18,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  barArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "56%",
    minWidth: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  baseline: {
    height: 1,
    marginTop: 9,
  },
});
