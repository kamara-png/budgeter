import { format } from "date-fns";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AmountInput } from "@/components/AmountInput";
import { EmptyState } from "@/components/EmptyState";
import { Fab } from "@/components/Fab";
import { ProgressBar } from "@/components/ProgressBar";
import { SimFilter } from "@/components/SimFilter";
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
import {
  ALL_SIMS,
  mergeCategoryBudgets,
  mergeFuliza,
  mergeOverallBudgets,
  simScopeIds,
  transactionsForSim,
} from "@/utils/sims";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { money, signed } = useMoney();
  const insets = useSafeAreaInsets();

  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const sims = useStore((s) => s.sims);
  const activeSimId = useStore((s) => s.activeSimId);
  const budgets = useStore((s) => s.budgets);
  const overallBudgets = useStore((s) => s.overallBudgets);
  const fuliza = useStore((s) => s.fuliza);
  const setFuliza = useStore((s) => s.setFuliza);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const scopeIds = useMemo(() => simScopeIds(sims, activeSimId), [sims, activeSimId]);
  const scopedTransactions = useMemo(
    () => transactionsForSim(transactions, activeSimId),
    [transactions, activeSimId],
  );
  const scopedBudgets = useMemo(
    () => mergeCategoryBudgets(budgets, scopeIds),
    [budgets, scopeIds],
  );
  const scopedOverallBudgets = useMemo(
    () => mergeOverallBudgets(overallBudgets, scopeIds),
    [overallBudgets, scopeIds],
  );
  const activeSim = useMemo(
    () =>
      activeSimId === ALL_SIMS
        ? undefined
        : sims.find((s) => s.id === activeSimId),
    [sims, activeSimId],
  );

  const key = useMemo(() => monthKey(new Date()), []);
  const monthName = format(new Date(), "MMMM");
  const totals = useMemo(
    () => totalsInMonth(scopedTransactions, key),
    [scopedTransactions, key],
  );
  const rows = useMemo(
    () => budgetRows(scopedTransactions, scopedBudgets, categories, key),
    [scopedTransactions, scopedBudgets, categories, key],
  );
  const recent = useMemo(
    () => scopedTransactions.slice(0, 6),
    [scopedTransactions],
  );
  const overallRows = useMemo(
    () => overallBudgetRows(scopedTransactions, scopedOverallBudgets),
    [scopedTransactions, scopedOverallBudgets],
  );

  const totalBudget = useMemo(() => rows.reduce((sum, r) => sum + r.limit, 0), [rows]);
  const spentBudget = useMemo(() => rows.reduce((sum, r) => sum + r.spent, 0), [rows]);
  const budgetPct = totalBudget > 0 ? spentBudget / totalBudget : 0;

  const net = totals.earned - totals.spent;

  const fulizaTotals = useMemo(() => mergeFuliza(fuliza, scopeIds), [fuliza, scopeIds]);
  const fulizaAvailable = Math.max(0, fulizaTotals.limit - fulizaTotals.outstanding);
  const netAfterFuliza = net - fulizaTotals.outstanding;
  const showFuliza = fulizaTotals.limit > 0 || fulizaTotals.outstanding > 0;

  const [fulizaAction, setFulizaAction] = useState<"borrow" | "repay" | null>(null);
  const [fulizaInput, setFulizaInput] = useState("");
  const [fulizaError, setFulizaError] = useState<string | null>(null);

  const activeFuliza = useMemo(
    () => (activeSim ? (fuliza[activeSim.id] ?? { limit: 0, outstanding: 0 }) : null),
    [fuliza, activeSim],
  );

  const openFulizaAction = (action: "borrow" | "repay") => {
    setFulizaInput("");
    setFulizaError(null);
    setFulizaAction(action);
  };
  const closeFulizaAction = () => setFulizaAction(null);

  const submitFulizaAction = () => {
    if (!activeSim || !fulizaAction || !activeFuliza) return;
    const value = Math.round(parseFloat(fulizaInput));
    if (!Number.isFinite(value) || value <= 0) {
      setFulizaError("Enter an amount greater than zero.");
      return;
    }
    if (fulizaAction === "borrow") {
      if (activeFuliza.limit <= 0) {
        setFulizaError("Set a Fuliza limit for this SIM in Settings first.");
        return;
      }
      const room = activeFuliza.limit - activeFuliza.outstanding;
      if (value > room) {
        setFulizaError(`Only ${money(room)} is available on this line.`);
        return;
      }
      setFuliza(activeSim.id, { outstanding: activeFuliza.outstanding + value });
    } else {
      if (activeFuliza.outstanding <= 0) {
        setFulizaError("Nothing is owed on this line.");
        return;
      }
      setFuliza(activeSim.id, {
        outstanding: Math.max(0, activeFuliza.outstanding - value),
      });
    }
    setFulizaAction(null);
  };

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
        <SimFilter />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.spentLabel, { color: colors.textSecondary }]}>
            {activeSim ? `Spent in ${monthName} · ${activeSim.label}` : `Spent in ${monthName}`}
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

        {showFuliza ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Fuliza</Text>
              <Text style={[styles.fulizaScope, { color: colors.textFaint }]}>
                {activeSim ? activeSim.label : "All SIMs"}
              </Text>
            </View>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.budgetTop}>
                <Text style={[styles.budgetAmount, { color: colors.textSecondary }]}>
                  {money(fulizaTotals.outstanding)} owed of {money(fulizaTotals.limit)}
                </Text>
                <Text style={[styles.budgetPct, { color: colors.text }]}>
                  {formatPercent(
                    fulizaTotals.limit > 0 ? fulizaTotals.outstanding / fulizaTotals.limit : 0,
                  )}
                </Text>
              </View>
              <ProgressBar
                value={fulizaTotals.outstanding}
                limit={fulizaTotals.limit}
                color={colors.primary}
              />

              <View style={[styles.fulizaStats, { borderTopColor: colors.border }]}>
                <View style={styles.fulizaStat}>
                  <Text style={[styles.fulizaStatValue, { color: colors.income }]}>
                    {money(fulizaAvailable)}
                  </Text>
                  <Text style={[styles.fulizaStatLabel, { color: colors.textSecondary }]}>
                    Available Fuliza
                  </Text>
                </View>
                <View style={[styles.vline, { backgroundColor: colors.border }]} />
                <View style={styles.fulizaStat}>
                  <Text
                    style={[
                      styles.fulizaStatValue,
                      { color: netAfterFuliza < 0 ? colors.expense : colors.text },
                    ]}
                  >
                    {signed(netAfterFuliza)}
                  </Text>
                  <Text style={[styles.fulizaStatLabel, { color: colors.textSecondary }]}>
                    Net after Fuliza
                  </Text>
                </View>
              </View>

              {activeSim ? (
                <View style={styles.fulizaActions}>
                  <Pressable
                    onPress={() => openFulizaAction("borrow")}
                    style={[styles.fulizaButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.fulizaButtonText, { color: colors.card }]}>Borrow</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openFulizaAction("repay")}
                    style={[styles.fulizaButton, { backgroundColor: colors.inputBg }]}
                  >
                    <Text style={[styles.fulizaButtonText, { color: colors.text }]}>Repay</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.fulizaHint, { color: colors.textFaint }]}>
                  Pick a SIM to borrow or repay its Fuliza.
                </Text>
              )}
            </View>
          </View>
        ) : null}

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
            {scopedTransactions.length > 0 ? (
              <Pressable onPress={seeAll} hitSlop={8}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            ) : null}
          </View>

          {scopedTransactions.length === 0 ? (
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

      <Modal
        visible={fulizaAction !== null}
        transparent
        animationType="none"
        onRequestClose={closeFulizaAction}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {fulizaAction === "borrow" ? "Borrow Fuliza" : "Repay Fuliza"}
            </Text>
            <Text style={[styles.modalSpent, { color: colors.textSecondary }]}>
              {fulizaAction === "borrow"
                ? `${money(fulizaAvailable)} available${activeSim ? ` on ${activeSim.label}` : ""}.`
                : `${money(fulizaTotals.outstanding)} owed${activeSim ? ` on ${activeSim.label}` : ""}.`}
            </Text>
            <View style={styles.modalAmount}>
              <AmountInput value={fulizaInput} onChangeText={setFulizaInput} autoFocus />
            </View>
            {fulizaError ? (
              <Text style={[styles.error, { color: colors.danger }]}>{fulizaError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable onPress={closeFulizaAction} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={submitFulizaAction}
                style={[styles.modalSave, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSaveText}>
                  {fulizaAction === "borrow" ? "Borrow" : "Repay"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  fulizaScope: {
    fontSize: 12,
    fontWeight: "600",
  },
  fulizaStats: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fulizaStat: {
    flex: 1,
    alignItems: "center",
  },
  fulizaStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  fulizaStatLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  fulizaActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  fulizaButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  fulizaButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  fulizaHint: {
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSpent: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  modalAmount: {
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalSave: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});