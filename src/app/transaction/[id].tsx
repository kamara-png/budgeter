import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AmountInput } from "@/components/AmountInput";
import { CalculatorModal } from "@/components/CalculatorModal";
import { CategoryPicker } from "@/components/CategoryPicker";
import { DatePickerModal } from "@/components/DatePickerModal";
import { EmptyState } from "@/components/EmptyState";
import { Segmented } from "@/components/Segmented";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import type { NewTransactionInput } from "@/store/useStore";
import type { Transaction, TransactionType } from "@/types";
import { fromISODate, roundAmount, toISODate } from "@/utils/format";

export default function TransactionScreen() {
  const { id, amount } = useLocalSearchParams<{ id: string; amount?: string }>();
  const isNew = id === "new";

  const { colors } = useTheme();
  const transactions = useStore((s) => s.transactions);
  const existing = transactions.find((t) => t.id === id);

  if (!isNew && !existing) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Transaction" }} />
        <EmptyState
          icon="warning"
          title="Transaction not found"
          subtitle="It may have been deleted."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <TransactionForm key={id} isNew={isNew} existing={existing} initialAmount={amount} />
  );
}

interface FormProps {
  isNew: boolean;
  existing?: Transaction;
  initialAmount?: string;
}

function TransactionForm({ isNew, existing, initialAmount }: FormProps) {
  const { colors } = useTheme();
  const categories = useStore((s) => s.categories);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const [amount, setAmount] = useState(() => {
    if (existing) return roundAmount(existing.amount).toString();
    if (initialAmount) {
      const parsed = roundAmount(parseFloat(initialAmount));
      if (Number.isFinite(parsed) && parsed > 0) return parsed.toString();
    }
    return "";
  });
  const [type, setType] = useState<TransactionType>(existing?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [date, setDate] = useState(() =>
    existing ? fromISODate(existing.date) : new Date(),
  );
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const availableCategories = categories.filter((c) => c.type === type);

  const changeType = (value: TransactionType) => {
    setType(value);
    const first = categories.find((c) => c.type === value);
    setCategoryId(first?.id ?? "");
  };

  const handleSave = () => {
    const value = roundAmount(parseFloat(amount));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!categoryId) {
      setError("Pick a category.");
      return;
    }
    const input: NewTransactionInput = {
      type,
      amount: value,
      categoryId,
      date: toISODate(date),
      note: note.trim() ? note.trim() : undefined,
    };
    if (isNew) addTransaction(input);
    else if (existing) updateTransaction(existing.id, input);
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert("Delete transaction", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTransaction(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{ title: isNew ? "New transaction" : "Edit transaction" }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.fill}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.amountHeader}>
              <Text style={[styles.label, styles.labelInline, { color: colors.textSecondary }]}>
                Amount
              </Text>
              <Pressable
                onPress={() => setShowCalculator(true)}
                hitSlop={8}
                style={[styles.calcButton, { backgroundColor: colors.inputBg }]}
              >
                <Ionicons name="calculator-outline" size={16} color={colors.primary} />
                <Text style={[styles.calcButtonText, { color: colors.primary }]}>Calculate</Text>
              </Pressable>
            </View>
            <AmountInput
              value={amount}
              onChangeText={setAmount}
              autoFocus={isNew}
              large
            />
          </View>

          <View
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Segmented
              options={[
                { label: "Expense", value: "expense" },
                { label: "Income", value: "income" },
              ]}
              value={type}
              onChange={changeType}
              activeColor={type === "expense" ? colors.expense : colors.income}
            />
          </View>

          <View
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <CategoryPicker
              categories={availableCategories}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          </View>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Date</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
              {format(date, "EEEE, d MMMM yyyy")}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>

          <View
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={colors.textFaint}
              multiline
              style={[styles.note, { color: colors.text }]}
            />
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.expense }]}>{error}</Text>
          ) : null}

          <Pressable onPress={handleSave} style={[styles.save, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>

          {!isNew ? (
            <Pressable
              onPress={confirmDelete}
              style={[styles.delete, { borderColor: colors.expense }]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.expense} />
              <Text style={[styles.deleteText, { color: colors.expense }]}>Delete transaction</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker ? (
        <DatePickerModal
          value={date}
          onSelect={(d) => {
            setDate(d);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      ) : null}

      {showCalculator ? (
        <CalculatorModal
          visible
          onClose={() => setShowCalculator(false)}
          initialValue={parseFloat(amount) || undefined}
          onUse={(value) => setAmount(roundAmount(value).toString())}
          useLabel="Use amount"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  labelInline: {
    marginBottom: 0,
  },
  amountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calcButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  calcButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
  },
  note: {
    minHeight: 44,
    fontSize: 15,
    padding: 0,
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  save: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  delete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "700",
  },
});