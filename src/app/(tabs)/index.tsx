import { format } from "date-fns";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { Fab } from "@/components/Fab";
import { ProgressBar } from "@/components/ProgressBar";
import { TransactionRow } from "@/components/TransactionRow";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import type { Transaction } from "@/types";
import {
  budgetRows,
  monthKey,
  overallBudgetRows,
  totalsInMonth,
} from "@/utils/aggregate";
import { formatPercent } from "@/utils/format";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { money, signed } = useMoney();
  const insets = useSafeAreaInsets();

  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const overallBudgets = useStore((s) => s.overallBudgets);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const key = useMemo(() => monthKey(new Date()), []);
  const monthName = format(new Date(), "MMMM");
  const totals = useMemo(() => totalsInMonth(transactions, key), [transactions, key]);
  const rows = useMemo(
    () => budgetRows(transactions, budgets, categories, key),
    [transactions, budgets, categories, key],
  );
  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);
  const overallRows = useMemo(
    () => overallBudgetRows(transactions, overallBudgets),
    [transactions, overallBudgets],
  );

  const totalBudget = useMemo(() => rows.reduce((sum, r) => sum + r.limit, 0), [rows]);
  const spentBudget = useMemo(() => rows.reduce((sum, r) => sum + r.spent, 0), [rows]);
  const budgetPct = totalBudget > 0 ? spentBudget / totalBudget : 0;

  const net = totals.earned - totals.spent;

  const add = () => router.push({ pathname: "/transaction/[id]", params: { id: "new" } });
  const seeAll = () => router.push("/transactions");
  const edit = (t: Transaction) =>
    router.push({ pathname: "/transaction/[id]", params: { id: t.id } });

  const confirmDelete = (t: Transaction) => {
    Alert.alert("Delete transaction", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(t.id) },
    ]);
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.spentLabel, { color: colors.textSecondary }]}>
            Spent in {monthName}
          </Text>
          <Text style={[styles.spentAmount, { color: colors.text }]}>
            {money(totals.spent)}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryValue, { color: colors.income }]}>
                {money(totals.earned)}
              </Text>
              <Text style={[styles.summarySub, { color: colors.textSecondary }]}>Income</Text>
            </View>
            <View style={[styles.vline, { backgroundColor: colors.border }]} />
            <View style={styles.summaryCol}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: net < 0 ? colors.expense : colors.text },
                ]}
              >
                {signed(net)}
              </Text>
              <Text style={[styles.summarySub, { color: colors.textSecondary }]}>Net</Text>
            </View>
            <View style={[styles.vline, { backgroundColor: colors.border }]} />
            <View style={styles.summaryCol}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: spentBudget > totalBudget ? colors.expense : colors.primary },
                ]}
              >
                {totalBudget > 0 ? money(totalBudget - spentBudget) : money(0)}
              </Text>
              <Text style={[styles.summarySub, { color: colors.textSecondary }]}>Left</Text>
            </View>
          </View>
        </View>

        {overallRows.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall budgets</Text>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {overallRows.map((r) => (
                <View key={r.period} style={styles.overallRow}>
                  <View style={styles.budgetCategoryTop}>
                    <Text style={[styles.budgetCategoryName, { color: colors.text }]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.budgetCategoryAmount, { color: colors.textSecondary }]}>
                      {money(r.spent)} / {money(r.limit)}
                    </Text>
                  </View>
                  <ProgressBar value={r.spent} limit={r.limit} />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {totalBudget > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly budget</Text>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.budgetTop}>
                <Text style={[styles.budgetAmount, { color: colors.textSecondary }]}>
                  {money(spentBudget)} of {money(totalBudget)}
                </Text>
                <Text style={[styles.budgetPct, { color: colors.text }]}>
                  {formatPercent(budgetPct)}
                </Text>
              </View>
              <ProgressBar value={spentBudget} limit={totalBudget} />

              {rows.map((r) => (
                <View key={r.category.id} style={styles.budgetCategory}>
                  <View style={styles.budgetCategoryTop}>
                    <Text
                      numberOfLines={1}
                      style={[styles.budgetCategoryName, { color: colors.text }]}
                    >
                      {r.category.name}
                    </Text>
                    <Text style={[styles.budgetCategoryAmount, { color: colors.textSecondary }]}>
                      {money(r.spent)} / {money(r.limit)}
                    </Text>
                  </View>
                  <ProgressBar value={r.spent} limit={r.limit} color={r.category.color} />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent activity</Text>
            {transactions.length > 0 ? (
              <Pressable onPress={seeAll} hitSlop={8}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            ) : null}
          </View>

          {transactions.length === 0 ? (
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <EmptyState
                icon="wallet"
                title="No transactions yet"
                subtitle="Add your first expense or income to start tracking your budget."
                actionLabel="Add transaction"
                onAction={add}
              />
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {recent.map((t) => (
                <TransactionRow
                  key={t.id}
                  item={t}
                  onPress={() => edit(t)}
                  onLongPress={() => confirmDelete(t)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Fab onPress={add} bottom={insets.bottom + 24} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: 16,
    gap: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  spentLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  spentAmount: {
    fontSize: 40,
    fontWeight: "800",
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  vline: {
    width: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  summarySub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "700",
  },
  budgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  budgetAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  budgetPct: {
    fontSize: 14,
    fontWeight: "800",
  },
  budgetCategory: {
    marginTop: 14,
    gap: 6,
  },
  overallRow: {
    marginTop: 14,
    gap: 6,
  },
  budgetCategoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  budgetCategoryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  budgetCategoryAmount: {
    fontSize: 12,
    fontWeight: "600",
  },
});