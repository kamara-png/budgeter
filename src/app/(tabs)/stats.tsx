import Ionicons from "@expo/vector-icons/Ionicons";
import {
  addMonths,
  format,
  isBefore,
  startOfMonth,
} from "date-fns";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CategoryRing } from "@/components/CategoryRing";
import { EmptyState } from "@/components/EmptyState";
import { MonthBars } from "@/components/MonthBars";
import { SimFilter } from "@/components/SimFilter";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import {
  monthlySeries,
  monthKey,
  spendingByCategory,
  totalsInMonth,
} from "@/utils/aggregate";
import { formatPercent } from "@/utils/format";
import { transactionsForSim } from "@/utils/sims";

export default function StatsScreen() {
  const { colors } = useTheme();
  const { money } = useMoney();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const activeSimId = useStore((s) => s.activeSimId);

  const scopedTransactions = useMemo(
    () => transactionsForSim(transactions, activeSimId),
    [transactions, activeSimId],
  );

  const selectedKey = useMemo(() => monthKey(month), [month]);
  const totals = useMemo(
    () => totalsInMonth(scopedTransactions, selectedKey),
    [scopedTransactions, selectedKey],
  );
  const byCategory = useMemo(
    () => spendingByCategory(scopedTransactions, categories, selectedKey),
    [scopedTransactions, categories, selectedKey],
  );
  const barData = useMemo(
    () =>
      monthlySeries(scopedTransactions, 6).map((entry, index, list) => ({
        ...entry,
        highlighted: index === list.length - 1,
      })),
    [scopedTransactions],
  );

  const currentMonth = startOfMonth(new Date());
  const canGoNext = isBefore(addMonths(month, 1), addMonths(currentMonth, 1));

  const nav = (delta: number) => setMonth((m) => addMonths(m, delta));
  // Only the biggest slices get their own color; everything else merges into
  // one "Other" wedge so the ring stays readable.
  const slices = useMemo(() => {
    const MAX_SLICES = 6;
    const main = byCategory.slice(0, MAX_SLICES).map((c) => ({
      value: c.amount,
      color: c.category.color,
      label: c.category.name,
    }));
    const rest = byCategory.slice(MAX_SLICES);
    if (rest.length > 0) {
      const extra = rest.reduce((sum, c) => sum + c.amount, 0);
      main.push({
        value: extra,
        color: colors.border,
        label: `Other (${rest.length})`,
      });
    }
    return main;
  }, [byCategory, colors.border]);
  const hasSpending = slices.length > 0;
  const hasBarData = barData.some((b) => b.value > 0);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
    >
      <SimFilter />

      <View style={styles.monthNav}>
        <Pressable
          onPress={() => nav(-1)}
          hitSlop={8}
          style={[styles.navButton, { backgroundColor: colors.inputBg }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {format(month, "MMMM yyyy")}
        </Text>
        <Pressable
          onPress={canGoNext ? () => nav(1) : undefined}
          disabled={!canGoNext}
          hitSlop={8}
          style={[
            styles.navButton,
            { backgroundColor: canGoNext ? colors.inputBg : colors.border },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNext ? colors.text : colors.textFaint}
          />
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Spent</Text>
        <Text style={[styles.cardAmount, { color: colors.text }]}>
          {money(totals.spent)}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.totalsRow}>
          <View style={styles.totalsCol}>
            <Text style={[styles.totalsValue, { color: colors.income }]}>
              {money(totals.earned)}
            </Text>
            <Text style={[styles.totalsLabel, { color: colors.textSecondary }]}>Income</Text>
          </View>
          <View style={styles.totalsCol}>
            <Text style={[styles.totalsValue, { color: colors.text }]}>
              {money(totals.spent)}
            </Text>
            <Text style={[styles.totalsLabel, { color: colors.textSecondary }]}>Expenses</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>By category</Text>
        {hasSpending ? (
          <>
            <View style={styles.ringWrap}>
              <CategoryRing
                data={slices}
                size={210}
                strokeWidth={22}
                trackColor={colors.inputBg}
              />
              <View style={styles.ringCenter} pointerEvents="none">
                <Text style={[styles.ringCenterLabel, { color: colors.textSecondary }]}>
                  Spent
                </Text>
                <Text numberOfLines={1} style={[styles.ringCenterAmount, { color: colors.text }]}>
                  {money(totals.spent)}
                </Text>
              </View>
            </View>
            <View style={styles.legend}>
              {slices.map((slice) => (
                <View key={slice.label} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: slice.color }]}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.legendName, { color: colors.text }]}
                  >
                    {slice.label}
                  </Text>
                  <Text style={[styles.legendAmount, { color: colors.text }]}>
                    {money(slice.value)}
                  </Text>
                  <Text style={[styles.legendPct, { color: colors.textFaint }]}>
                    {formatPercent(slice.value / totals.spent)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <EmptyState
            icon="pie-chart"
            title="No spending this month"
            subtitle="Expenses you add will show up here by category."
          />
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Last 6 months</Text>
        {hasBarData ? (
          <MonthBars data={barData} height={150} />
        ) : (
          <EmptyState
            icon="bar-chart"
            title="No history yet"
            subtitle="Your spending over the last 6 months will appear here."
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: "stretch",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardAmount: {
    fontSize: 34,
    fontWeight: "800",
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  totalsRow: {
    flexDirection: "row",
  },
  totalsCol: {
    flex: 1,
    alignItems: "center",
  },
  totalsValue: {
    fontSize: 17,
    fontWeight: "800",
  },
  totalsLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  ringWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  ringCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 8,
    bottom: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  ringCenterLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  ringCenterAmount: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  legend: {
    marginTop: 18,
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: "700",
    marginRight: 10,
  },
  legendPct: {
    fontSize: 13,
    fontWeight: "600",
    width: 44,
    textAlign: "right",
  },
});