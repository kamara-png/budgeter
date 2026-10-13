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
        {item.note ? (
          <Text
            numberOfLines={1}
            style={[styles.note, { color: colors.textSecondary }]}
          >
            {item.note}
          </Text>
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
    fontSize: 13,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
});