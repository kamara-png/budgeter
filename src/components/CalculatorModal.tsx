import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type Operator = "+" | "-" | "×" | "÷";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUse?: (value: number) => void;
  useLabel?: string;
  initialValue?: number;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  const rounded = Math.round(value * 1e8) / 1e8;
  return rounded.toString();
}

function compute(a: number, b: number, op: Operator): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
  return b;
}

function Key({
  onPress,
  background,
  children,
  flex = 1,
}: {
  onPress: () => void;
  background: string;
  children: ReactNode;
  flex?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: background, flex, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function CalculatorModal({
  visible,
  onClose,
  onUse,
  useLabel = "Use amount",
  initialValue,
}: Props) {
  const { colors } = useTheme();
  const [display, setDisplay] = useState(() =>
    initialValue !== undefined ? formatNumber(initialValue) : "0",
  );
  const [pending, setPending] = useState<{ value: number; op: Operator } | null>(null);
  const [history, setHistory] = useState("");
  const [overwrite, setOverwrite] = useState(initialValue !== undefined);

  const inputDigit = (digit: string) => {
    if (overwrite) {
      setDisplay(digit);
      setOverwrite(false);
    } else {
      setDisplay(display === "0" ? digit : `${display}${digit}`);
    }
  };

  const inputDecimal = () => {
    if (overwrite) {
      setDisplay("0.");
      setOverwrite(false);
    } else if (!display.includes(".")) {
      setDisplay(`${display}.`);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPending(null);
    setHistory("");
    setOverwrite(false);
  };

  const backspace = () => {
    if (overwrite) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  };

  const percent = () => {
    const current = parseFloat(display);
    if (!Number.isFinite(current)) return;
    setDisplay(formatNumber(current / 100));
    setOverwrite(false);
  };

  const chooseOperator = (op: Operator) => {
    const current = parseFloat(display);
    if (!Number.isFinite(current)) return;
    let left = current;
    if (pending && !overwrite) {
      left = compute(pending.value, current, pending.op);
      setDisplay(formatNumber(left));
    }
    setPending({ value: left, op });
    setHistory(`${formatNumber(left)} ${op}`);
    setOverwrite(true);
  };

  const equals = () => {
    if (!pending) return;
    const current = parseFloat(display);
    if (!Number.isFinite(current)) return;
    const result = compute(pending.value, current, pending.op);
    setHistory(`${formatNumber(pending.value)} ${pending.op} ${formatNumber(current)} =`);
    setDisplay(formatNumber(result));
    setPending(null);
    setOverwrite(true);
  };

  const use = () => {
    const value = parseFloat(display);
    if (onUse && Number.isFinite(value)) onUse(value);
    onClose();
  };

  const digitColor = colors.text;
  const operatorBg = `${colors.primary}1F`;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Ionicons name="calculator-outline" size={18} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Calculator</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.display, { backgroundColor: colors.inputBg }]}>
            <Text numberOfLines={1} style={[styles.history, { color: colors.textFaint }]}>
              {history || " "}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.result, { color: colors.text }]}
            >
              {display}
            </Text>
          </View>

          <View style={styles.keypad}>
            <View style={styles.keyRow}>
              <Key onPress={clear} background={colors.inputBg}>
                <Text style={[styles.keyText, { color: colors.expense }]}>AC</Text>
              </Key>
              <Key onPress={backspace} background={colors.inputBg}>
                <Ionicons name="backspace-outline" size={22} color={colors.text} />
              </Key>
              <Key onPress={percent} background={colors.inputBg}>
                <Text style={[styles.keyText, { color: colors.primary }]}>%</Text>
              </Key>
              <Key onPress={() => chooseOperator("÷")} background={operatorBg}>
                <Text style={[styles.keyText, { color: colors.primary }]}>÷</Text>
              </Key>
            </View>

            <View style={styles.keyRow}>
              {["7", "8", "9"].map((d) => (
                <Key key={d} onPress={() => inputDigit(d)} background={colors.inputBg}>
                  <Text style={[styles.keyText, { color: digitColor }]}>{d}</Text>
                </Key>
              ))}
              <Key onPress={() => chooseOperator("×")} background={operatorBg}>
                <Text style={[styles.keyText, { color: colors.primary }]}>×</Text>
              </Key>
            </View>

            <View style={styles.keyRow}>
              {["4", "5", "6"].map((d) => (
                <Key key={d} onPress={() => inputDigit(d)} background={colors.inputBg}>
                  <Text style={[styles.keyText, { color: digitColor }]}>{d}</Text>
                </Key>
              ))}
              <Key onPress={() => chooseOperator("-")} background={operatorBg}>
                <Text style={[styles.keyText, { color: colors.primary }]}>−</Text>
              </Key>
            </View>

            <View style={styles.keyRow}>
              {["1", "2", "3"].map((d) => (
                <Key key={d} onPress={() => inputDigit(d)} background={colors.inputBg}>
                  <Text style={[styles.keyText, { color: digitColor }]}>{d}</Text>
                </Key>
              ))}
              <Key onPress={() => chooseOperator("+")} background={operatorBg}>
                <Text style={[styles.keyText, { color: colors.primary }]}>+</Text>
              </Key>
            </View>

            <View style={styles.keyRow}>
              <Key onPress={() => inputDigit("0")} background={colors.inputBg} flex={2}>
                <Text style={[styles.keyText, { color: digitColor }]}>0</Text>
              </Key>
              <Key onPress={inputDecimal} background={colors.inputBg}>
                <Text style={[styles.keyText, { color: digitColor }]}>.</Text>
              </Key>
              <Key onPress={equals} background={colors.primary}>
                <Text style={[styles.keyText, styles.equalsText]}>=</Text>
              </Key>
            </View>
          </View>

          {onUse ? (
            <Pressable
              onPress={use}
              style={[styles.useButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.useButtonText}>{useLabel}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onClose}
              style={[styles.useButton, { backgroundColor: colors.inputBg }]}
            >
              <Text style={[styles.useButtonText, { color: colors.text }]}>Done</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  display: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "flex-end",
  },
  history: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    minHeight: 18,
  },
  result: {
    fontSize: 40,
    fontWeight: "800",
  },
  keypad: {
    gap: 10,
    marginTop: 16,
  },
  keyRow: {
    flexDirection: "row",
    gap: 10,
  },
  key: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 22,
    fontWeight: "700",
  },
  equalsText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  useButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  useButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
