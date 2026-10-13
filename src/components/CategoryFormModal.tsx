import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/constants/categories";
import { useTheme } from "@/hooks/useTheme";
import type { NewCategoryInput } from "@/store/useStore";
import type { Category, IconName, TransactionType } from "@/types";

interface Props {
  initial: Category | null;
  onSubmit: (input: NewCategoryInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function CategoryFormModal({ initial, onSubmit, onDelete, onClose }: Props) {
  const { colors } = useTheme();

  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [icon, setIcon] = useState<IconName>(initial?.icon ?? "pricetag");
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a category name.");
      return;
    }
    onSubmit({ name: trimmed, type, icon, color });
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {initial ? "Edit category" : "New category"}
          </Text>

          <View style={styles.preview}>
            <View style={[styles.previewIcon, { backgroundColor: `${color}26` }]}>
              <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={[styles.previewName, { color: colors.text }]}>
              {name.trim() || "Category name"}
            </Text>
          </View>

          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(null);
            }}
            placeholder="Category name"
            placeholderTextColor={colors.textFaint}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.inputBg },
            ]}
          />

          <View style={styles.typeRow}>
            {(["expense", "income"] as TransactionType[]).map((t) => {
              const active = type === t;
              const activeColor = t === "expense" ? colors.expense : colors.income;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: active ? activeColor : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: active ? "#FFFFFF" : colors.textSecondary },
                    ]}
                  >
                    {t === "expense" ? "Expense" : "Income"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Icon</Text>
          <ScrollView style={styles.iconScroll} contentContainerStyle={styles.iconGrid}>
            {CATEGORY_ICONS.map((name_) => {
              const selected = name_ === icon;
              return (
                <Pressable
                  key={name_}
                  onPress={() => setIcon(name_)}
                  style={[
                    styles.iconCell,
                    {
                      backgroundColor: selected ? `${color}26` : colors.inputBg,
                      borderColor: selected ? color : "transparent",
                    },
                  ]}
                >
                  <Ionicons
                    name={name_}
                    size={20}
                    color={selected ? color : colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorGrid}>
            {CATEGORY_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c, borderColor: color === c ? colors.text : "transparent" },
                ]}
              >
                {color === c ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : null}
              </Pressable>
            ))}
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.actionButton}>
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            {onDelete ? (
              <Pressable onPress={onDelete} style={styles.actionButton}>
                <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={save}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 10,
  },
  iconScroll: {
    maxHeight: 132,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: 13,
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
