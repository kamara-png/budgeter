import Ionicons from "@expo/vector-icons/Ionicons";
import { format, getDaysInMonth, isSameDay, isToday } from "date-fns";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePickerModal({ value, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const weeks = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const offset = first.getDay();
    const days = getDaysInMonth(viewMonth);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth]);

  const title = format(viewMonth, "MMMM yyyy");

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.nav}>
            <Pressable
              onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              hitSlop={8}
              style={[styles.navButton, { backgroundColor: colors.inputBg }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              hitSlop={8}
              style={[styles.navButton, { backgroundColor: colors.inputBg }]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={[styles.weekday, { color: colors.textFaint }]}>
                {w}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={`empty-${di}`} style={styles.dayCell} />;
                const selected = isSameDay(day, value);
                const today = isToday(day);
                return (
                  <View key={`day-${di}`} style={styles.dayCell}>
                    <Pressable onPress={() => onSelect(day)}>
                      <View
                        style={[
                          styles.day,
                          selected && { backgroundColor: colors.primary },
                          today && !selected && {
                            borderWidth: 1.5,
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            {
                              color: selected
                                ? "#FFFFFF"
                                : today
                                  ? colors.primary
                                  : colors.text,
                              fontWeight: today ? "700" : "500",
                            },
                          ]}
                        >
                          {format(day, "d")}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.footer}>
            <Pressable
              onPress={() => onSelect(new Date())}
              style={[styles.footerButton, { backgroundColor: colors.inputBg }]}
            >
              <Text style={[styles.footerText, { color: colors.text }]}>Today</Text>
            </Pressable>
          </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekday: {
    width: "14.2857%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 6,
  },
  dayCell: {
    width: "14.2857%",
    paddingVertical: 2,
    alignItems: "center",
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 15,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  footerButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "700",
  },
});