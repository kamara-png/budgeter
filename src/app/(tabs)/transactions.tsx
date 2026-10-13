import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Tabs } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { Segmented } from "@/components/Segmented";
import { TransactionRow } from "@/components/TransactionRow";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import type { IconName, Transaction, TransactionType } from "@/types";
import { groupByDay } from "@/utils/aggregate";

type TypeFilter = "all" | TransactionType;

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { signed } = useMoney();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [categoryId, setCategoryId] = useState("all");

  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const visibleCategories = useMemo(
    () => (type === "all" ? categories : categories.filter((c) => c.type === type)),
    [categories, type],
  );

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (categoryId !== "all" && t.categoryId !== categoryId) return false;
      if (q) {
        const cat = categories.find((c) => c.id === t.categoryId);
        const hay = `${t.note ?? ""} ${cat?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return groupByDay(filtered).map((g) => ({
      title: g.label,
      total: g.total,
      data: g.items,
    }));
  }, [transactions, categories, query, type, categoryId]);

  const add = () => router.push({ pathname: "/transaction/[id]", params: { id: "new" } });
  const edit = (t: Transaction) =>
    router.push({ pathname: "/transaction/[id]", params: { id: t.id } });

  const confirmDelete = (t: Transaction) => {
    Alert.alert("Delete transaction", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(t.id) },
    ]);
  };

  const changeType = (value: TypeFilter) => {
    setType(value);
    setCategoryId("all");
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={add} hitSlop={8} style={styles.headerAdd}>
              <Ionicons name="add" size={26} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.controls}>
        <View style={[styles.search, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes or categories"
            placeholderTextColor={colors.textFaint}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>

        <Segmented
          options={[
            { label: "All", value: "all" },
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
          value={type}
          onChange={changeType}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            <Chip
              label="All"
              active={categoryId === "all"}
              color={colors.primary}
              onPress={() => setCategoryId("all")}
            />
            {visibleCategories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                icon={c.icon}
                color={c.color}
                active={categoryId === c.id}
                onPress={() => setCategoryId(c.id === categoryId ? "all" : c.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.sectionTotal, { color: colors.textSecondary }]}>
              {signed(section.total)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            item={item}
            onPress={() => edit(item)}
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="funnel"
            title="No transactions found"
            subtitle="Try adjusting your search or filters, or add a new transaction."
            actionLabel="Add transaction"
            onAction={add}
          />
        }
      />
    </View>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  color: string;
  icon?: IconName;
  onPress: () => void;
}

function Chip({ label, active, color, icon, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? color : colors.inputBg, borderColor: colors.border },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? "#FFFFFF" : color} /> : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? "#FFFFFF" : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionTotal: {
    fontSize: 13,
    fontWeight: "700",
  },
  headerAdd: {
    marginRight: 16,
  },
});