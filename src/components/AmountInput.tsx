import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  large?: boolean;
}

function sanitizeAmount(input: string): string {
  const digits = input.replace(/[^0-9]/g, "");
  return digits.replace(/^0+(?=\d)/, "").slice(0, 9);
}

export function AmountInput({
  value,
  onChangeText,
  autoFocus,
  placeholder = "0",
  large,
}: Props) {
  const { colors } = useTheme();
  const symbol = useStore((s) => s.currency.symbol);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.symbol, { color: colors.textFaint }]}>{symbol}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(sanitizeAmount(t))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType="number-pad"
        maxLength={12}
        style={[
          styles.input,
          large && styles.inputLarge,
          {
            color: colors.text,
            borderBottomColor: focused ? colors.primary : "transparent",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  symbol: {
    fontSize: 22,
    fontWeight: "700",
    marginRight: 6,
  },
  input: {
    minWidth: 120,
    fontSize: 34,
    fontWeight: "800",
    paddingVertical: 6,
    borderBottomWidth: 2,
    textAlign: "center",
  },
  inputLarge: {
    fontSize: 44,
  },
});