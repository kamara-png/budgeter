import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import type { Transaction } from "@/types";

interface Props {
  item: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
}

function TransactionRowBase({ item, onPress, onLongPress }: Props) {
  const { colors } = useTheme();
  const { money, signed } = useMoney();
  const category = useStore((s) =>
    s.categories.find((c) => c.id === item.categoryId),
  );
  const sim = useStore((s) => s.sims.find((x) => x.id === item.simId));
  const showSim = useStore((s) => s.sims.length > 1);
  const icon = category?.icon ?? "help-circle";
  const color = category?.color ?? colors.textFaint;
  const isExpense = item.type === "expense";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}26` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.middle}>
        <Text
          numberOfLines={1}
          style={[styles.name, { color: colors.text }]}
        >
          {category?.name ?? "Other"}
        </Text>
        {item.note || (showSim && sim) ? (
          <View style={styles.meta}>
            {showSim && sim ? (
              <View style={[styles.simTag, { backgroundColor: `${sim.color}1A` }]}>
                <View style={[styles.simDot, { backgroundColor: sim.color }]} />
                <Text
                  numberOfLines={1}
                  style={[styles.simText, { color: sim.color }]}
                >
                  {sim.label}
                </Text>
              </View>
            ) : null}
            {item.note ? (
              <Text
                numberOfLines={1}
                style={[styles.note, { color: colors.textSecondary }]}
              >
                {item.note}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.amount,
          { color: isExpense ? colors.expense : colors.income },
        ]}
      >
        {isExpense ? money(-item.amount) : signed(item.amount)}
      </Text>
    </TouchableOpacity>
  );
}

export const TransactionRow = memo(TransactionRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  middle: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  note: {
    flexShrink: 1,
    fontSize: 13,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  simTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  simDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  simText: {
    maxWidth: 80,
    fontSize: 11,
    fontWeight: "700",
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
});