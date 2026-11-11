import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SIM_COLORS } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import type { NewSimInput } from "@/store/useStore";
import type { Sim } from "@/types";

interface Props {
  initial: Sim | null;
  onSubmit: (input: NewSimInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function SimFormModal({ initial, onSubmit, onDelete, onClose }: Props) {
  const { colors } = useTheme();

  const [label, setLabel] = useState(initial?.label ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [color, setColor] = useState(initial?.color ?? SIM_COLORS[0].value);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Give this SIM a name.");
      return;
    }
    onSubmit({ label: trimmed, number: number.trim(), color });
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {initial ? "Edit SIM card" : "New SIM card"}
          </Text>

          <View style={styles.preview}>
            <View style={[styles.previewIcon, { backgroundColor: `${color}26` }]}>
              <Ionicons name="cellular" size={26} color={color} />
            </View>
            <View style={styles.previewBody}>
              <Text numberOfLines={1} style={[styles.previewName, { color: colors.text }]}>
                {label.trim() || "SIM name"}
              </Text>
              <Text numberOfLines={1} style={[styles.previewNumber, { color: colors.textFaint }]}>
                {number.trim() || "Phone number (optional)"}
              </Text>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
          <TextInput
            value={label}
            onChangeText={(text) => {
              setLabel(text);
              setError(null);
            }}
            placeholder="e.g. Safaricom, Work line"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg }]}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Phone number</Text>
          <TextInput
            value={number}
            onChangeText={setNumber}
            placeholder="e.g. 0712 345 678"
            placeholderTextColor={colors.textFaint}
            keyboardType="phone-pad"
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg }]}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorGrid}>
            {SIM_COLORS.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => setColor(c.value)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: c.value,
                    borderColor: color === c.value ? colors.text : "transparent",
                  },
                ]}
              >
                {color === c.value ? (
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
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBody: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    fontSize: 17,
    fontWeight: "700",
  },
  previewNumber: {
    fontSize: 13,
    fontWeight: "500",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
