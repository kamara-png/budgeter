import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AmountInput } from "@/components/AmountInput";
import { CategoryFormModal } from "@/components/CategoryFormModal";
import { ProgressBar } from "@/components/ProgressBar";
import { Segmented } from "@/components/Segmented";
import { CURRENCIES } from "@/constants/currencies";
import { ACCENT_COLORS } from "@/constants/theme";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useStore, type NewCategoryInput } from "@/store/useStore";
import type { BudgetPeriod, Category, IconName, ThemeMode } from "@/types";
import { budgetRows, monthKey, spentForCategory } from "@/utils/aggregate";

const OVERALL_PERIODS: { period: BudgetPeriod; label: string }[] = [
  { period: "daily", label: "Daily" },
  { period: "weekly", label: "Weekly" },
  { period: "monthly", label: "Monthly" },
];

function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { money } = useMoney();

  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const overallBudgets = useStore((s) => s.overallBudgets);
  const transactions = useStore((s) => s.transactions);
  const themeMode = useStore((s) => s.themeMode);
  const currency = useStore((s) => s.currency);
  const accent = useStore((s) => s.accent);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const setBudget = useStore((s) => s.setBudget);
  const setOverallBudget = useStore((s) => s.setOverallBudget);
  const setCurrency = useStore((s) => s.setCurrency);
  const setAccent = useStore((s) => s.setAccent);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const clearAll = useStore((s) => s.clearAll);

  const [editing, setEditing] = useState<Category | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<BudgetPeriod | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<{
    category: Category | null;
  } | null>(null);
  const [showCurrency, setShowCurrency] = useState(false);

  const key = monthKey(new Date());
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const rows = budgetRows(transactions, budgets, categories, key);
  const rowByCategory = new Map(rows.map((r) => [r.category.id, r]));
  const activeAccent = ACCENT_COLORS.find((c) => c.value === accent);

  const openBudget = (category: Category) => {
    const current = budgets[category.id] ?? 0;
    setBudgetInput(current > 0 ? current.toString() : "");
    setBudgetError(null);
    setEditing(category);
  };
  const closeBudget = () => setEditing(null);

  const openOverallBudget = (period: BudgetPeriod) => {
    const current = overallBudgets[period] ?? 0;
    setBudgetInput(current > 0 ? current.toString() : "");
    setBudgetError(null);
    setEditingPeriod(period);
  };
  const closeOverallBudget = () => setEditingPeriod(null);

  const saveBudget = () => {
    if (!editing) return;
    const value = Math.round(parseFloat(budgetInput));
    if (!Number.isFinite(value) || value <= 0) {
      setBudgetError("Enter an amount greater than zero.");
      return;
    }
    setBudget(editing.id, value);
    setEditing(null);
  };

  const saveOverallBudget = () => {
    if (!editingPeriod) return;
    const value = Math.round(parseFloat(budgetInput));
    if (!Number.isFinite(value) || value <= 0) {
      setBudgetError("Enter an amount greater than zero.");
      return;
    }
    setOverallBudget(editingPeriod, value);
    setEditingPeriod(null);
  };

  const clearBudget = () => {
    if (!editing) return;
    setBudget(editing.id, 0);
    setEditing(null);
  };

  const clearOverallBudget = () => {
    if (!editingPeriod) return;
    setOverallBudget(editingPeriod, 0);
    setEditingPeriod(null);
  };

  const submitCategory = (input: NewCategoryInput) => {
    const editingCategory = categoryEditor?.category;
    if (editingCategory) updateCategory(editingCategory.id, input);
    else addCategory(input);
    setCategoryEditor(null);
  };

  const requestDeleteCategory = () => {
    const category = categoryEditor?.category;
    if (!category) return;
    const used = transactions.filter((t) => t.categoryId === category.id).length;
    Alert.alert(
      "Delete category",
      used > 0
        ? `${used} transaction${used === 1 ? "" : "s"} use this category. They will be kept, but shown as uncategorized.`
        : "This category will be removed. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCategory(category.id);
            setCategoryEditor(null);
          },
        },
      ],
    );
  };

  const confirmClearAll = () => {
    Alert.alert("Delete all data", "This removes every transaction and budget. It cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete everything", style: "destructive", onPress: clearAll },
    ]);
  };

  const budgetPeriodLabel = editingPeriod
    ? OVERALL_PERIODS.find((p) => p.period === editingPeriod)?.label
    : "";

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
    >
      <SectionTitle icon="speedometer" title="Overall budgets" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {OVERALL_PERIODS.map((p) => {
          const limit = overallBudgets[p.period] ?? 0;
          return (
            <Pressable
              key={p.period}
              onPress={() => openOverallBudget(p.period)}
              style={[styles.row, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${accent}1F` }]}>
                <Ionicons
                  name={
                    p.period === "daily"
                      ? "today-outline"
                      : p.period === "weekly"
                        ? "calendar-outline"
                        : "calendar-number-outline"
                  }
                  size={18}
                  color={accent}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowName, { color: colors.text }]}>{p.label}</Text>
                <Text style={[styles.rowType, { color: colors.textFaint }]}>
                  Spending limit
                </Text>
              </View>
              <Text
                style={[
                  limit > 0 ? styles.rowAmount : styles.rowSet,
                  { color: limit > 0 ? colors.textSecondary : colors.textFaint },
                ]}
              >
                {limit > 0 ? money(limit) : "Set"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          );
        })}
      </View>

      <SectionTitle icon="wallet" title="Monthly category budgets" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Set a limit per category. Tapping a category lets you edit or remove its budget.
        </Text>
        {expenseCategories.map((category) => {
          const row = rowByCategory.get(category.id);
          const hasBudget = row !== undefined;
          return (
            <Pressable
              key={category.id}
              onPress={() => openBudget(category)}
              style={[styles.row, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${category.color}26` }]}>
                <Ionicons name={category.icon} size={18} color={category.color} />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowName, { color: colors.text }]}>{category.name}</Text>
                  {hasBudget ? (
                    <Text style={[styles.rowAmount, { color: colors.textSecondary }]}>
                      {row.limit > 0 ? money(row.limit) : ""}
                    </Text>
                  ) : (
                    <Text style={[styles.rowSet, { color: colors.textFaint }]}>Set budget</Text>
                  )}
                </View>
                {hasBudget ? (
                  <ProgressBar
                    value={row.spent}
                    limit={row.limit}
                    color={category.color}
                    height={6}
                  />
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeaderRow}>
        <SectionTitle icon="pricetags" title="Categories" />
        <Pressable
          onPress={() => setCategoryEditor({ category: null })}
          hitSlop={8}
          style={styles.addCategory}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={[styles.addCategoryText, { color: colors.primary }]}>Add</Text>
        </Pressable>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setCategoryEditor({ category })}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: `${category.color}26` }]}>
              <Ionicons name={category.icon} size={18} color={category.color} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowName, { color: colors.text }]}>{category.name}</Text>
              <Text style={[styles.rowType, { color: colors.textFaint }]}>
                {category.type === "expense" ? "Expense" : "Income"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </View>

      <SectionTitle icon="color-palette" title="Accent color" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.accentGrid}>
          {ACCENT_COLORS.map((c) => {
            const selected = c.value === accent;
            const swatchColor = c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setAccent(swatchColor)}
                style={[
                  styles.accentSwatch,
                  { backgroundColor: swatchColor, borderColor: selected ? colors.text : "transparent" },
                ]}
              >
                {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.accentName, { color: colors.textSecondary }]}>
          {activeAccent ? `${activeAccent.name} · ${activeAccent.value}` : accent}
        </Text>
      </View>

      <SectionTitle icon="cash" title="Currency" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable onPress={() => setShowCurrency(true)} style={styles.currencyRow}>
          <View style={styles.rowBody}>
            <Text style={[styles.rowName, { color: colors.text }]}>{currency.name}</Text>
            <Text style={[styles.rowType, { color: colors.textFaint }]}>{currency.code}</Text>
          </View>
          <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
            {currency.symbol}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>
      </View>

      <SectionTitle icon="contrast" title="Appearance" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Segmented
          options={[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "System", value: "system" },
          ]}
          value={themeMode}
          onChange={(value) => setThemeMode(value as ThemeMode)}
        />
      </View>

      <SectionTitle icon="server" title="Data" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.dataRow}>
          <Text style={[styles.dataText, { color: colors.textSecondary }]}>
            {transactions.length} transaction{transactions.length === 1 ? "" : "s"} on this device
          </Text>
          <Pressable onPress={confirmClearAll} style={styles.deleteButton}>
            <Ionicons name="trash" size={16} color={colors.danger} />
            <Text style={[styles.deleteText, { color: colors.danger }]}>Delete all</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.version, { color: colors.textFaint }]}>Budgeter v1.0.0</Text>

      <Modal visible={editing !== null} transparent animationType="none" onRequestClose={closeBudget}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editing ? `${editing.name} budget` : ""}
            </Text>
            <Text style={[styles.modalSpent, { color: colors.textSecondary }]}>
              Spent this month:{" "}
              {editing ? money(spentForCategory(transactions, editing.id, key)) : ""}
            </Text>
            <View style={styles.modalAmount}>
              <AmountInput value={budgetInput} onChangeText={setBudgetInput} autoFocus />
            </View>
            {budgetError ? (
              <Text style={[styles.error, { color: colors.danger }]}>{budgetError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable onPress={closeBudget} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
              {budgets[editing?.id ?? ""] ? (
                <Pressable onPress={clearBudget} style={styles.modalButton}>
                  <Text style={[styles.modalButtonText, { color: colors.expense }]}>Remove</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={saveBudget}
                style={[styles.modalSave, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editingPeriod !== null}
        transparent
        animationType="none"
        onRequestClose={closeOverallBudget}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {budgetPeriodLabel} budget
            </Text>
            <Text style={[styles.modalSpent, { color: colors.textSecondary }]}>
              Set an overall spending limit for this period.
            </Text>
            <View style={styles.modalAmount}>
              <AmountInput value={budgetInput} onChangeText={setBudgetInput} autoFocus />
            </View>
            {budgetError ? (
              <Text style={[styles.error, { color: colors.danger }]}>{budgetError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable onPress={closeOverallBudget} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
              {editingPeriod && (overallBudgets[editingPeriod] ?? 0) > 0 ? (
                <Pressable onPress={clearOverallBudget} style={styles.modalButton}>
                  <Text style={[styles.modalButtonText, { color: colors.expense }]}>Remove</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={saveOverallBudget}
                style={[styles.modalSave, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCurrency}
        transparent
        animationType="none"
        onRequestClose={() => setShowCurrency(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setShowCurrency(false)}
        >
          <Pressable style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Currency</Text>
            <ScrollView style={styles.currencyList}>
              {CURRENCIES.map((c) => {
                const active = c.code === currency.code;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      setCurrency(c.code);
                      setShowCurrency(false);
                    }}
                    style={[styles.currencyItem, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.currencyItemSymbol, { color: colors.text }]}>
                      {c.symbol}
                    </Text>
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowName, { color: colors.text }]}>{c.name}</Text>
                      <Text style={[styles.rowType, { color: colors.textFaint }]}>{c.code}</Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {categoryEditor ? (
        <CategoryFormModal
          key={categoryEditor.category?.id ?? "new"}
          initial={categoryEditor.category}
          onSubmit={submitCategory}
          onDelete={categoryEditor.category ? requestDeleteCategory : undefined}
          onClose={() => setCategoryEditor(null)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  addCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addCategoryText: {
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowType: {
    fontSize: 12,
    fontWeight: "500",
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowSet: {
    fontSize: 13,
    fontWeight: "500",
  },
  accentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  accentSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  accentName: {
    fontSize: 13,
    fontWeight: "600",
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currencySymbol: {
    fontSize: 17,
    fontWeight: "700",
  },
  currencyList: {
    maxHeight: 360,
    marginTop: 8,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  currencyItemSymbol: {
    width: 32,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dataText: {
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "700",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
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
