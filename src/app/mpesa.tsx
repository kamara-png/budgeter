import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import { router, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  isMpesaSmsAvailable,
  readMpesaMessagesAsync,
} from "../../modules/mpesa-sms";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import { fromISODate } from "@/utils/format";
import {
  parseMpesaMessage,
  toTransactionInput,
  type ParsedMpesaMessage,
} from "@/utils/mpesa";

export default function MpesaImportScreen() {
  const { colors } = useTheme();
  const { money } = useMoney();
  const insets = useSafeAreaInsets();

  const transactions = useStore((s) => s.transactions);
  const importedIds = useStore((s) => s.importedMpesaIds);
  const addTransactions = useStore((s) => s.addTransactions);
  const markMpesaImported = useStore((s) => s.markMpesaImported);

  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedMpesaMessage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const existingKeys = useMemo(
    () =>
      new Set(
        transactions.map((t) => `${t.date}|${t.type}|${Math.round(t.amount)}`),
      ),
    [transactions],
  );

  const supported = isMpesaSmsAvailable;

  const scan = useCallback(async () => {
    setError(null);
    if (!supported) {
      setError("Reading M-Pesa messages is only available in the Android app.");
      return;
    }
    setScanning(true);
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "Read M-Pesa messages",
          message:
            "Budgeter reads your M-Pesa SMS to import transactions. Messages stay on your device.",
          buttonPositive: "Allow",
          buttonNegative: "Cancel",
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setError(
          "SMS permission was denied. Enable it in system settings to import.",
        );
        return;
      }

      const messages = await readMpesaMessagesAsync({ limit: 1000 });
      const alreadyImported = new Set(importedIds);
      const seen = new Set<string>();
      const parsed: ParsedMpesaMessage[] = [];

      for (const message of messages) {
        if (alreadyImported.has(message.id) || seen.has(message.id)) continue;
        const item = parseMpesaMessage(message);
        if (!item) continue;
        const key = `${item.date}|${item.direction}|${Math.round(item.amount)}`;
        if (existingKeys.has(key)) continue;
        seen.add(message.id);
        parsed.push(item);
      }

      parsed.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      setItems(parsed);
      setSelected(new Set(parsed.map((p) => p.smsId)));
      setScanned(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read messages.");
    } finally {
      setScanning(false);
    }
  }, [existingKeys, importedIds, supported]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.smsId)));

  const importSelected = () => {
    const chosen = items.filter((i) => selected.has(i.smsId));
    if (chosen.length === 0) {
      Alert.alert("Nothing selected", "Select at least one transaction to import.");
      return;
    }
    addTransactions(chosen.map(toTransactionInput));
    markMpesaImported(chosen.map((i) => i.smsId));
    router.back();
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Import from M-Pesa" }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              M-Pesa confirmation messages
            </Text>
          </View>
          <Text style={[styles.infoBody, { color: colors.textSecondary }]}>
            Budgeter scans your SMS inbox for M-Pesa confirmations and turns them into
            transactions. Everything is parsed on your device — nothing is uploaded.
          </Text>
          {!supported ? (
            <Text style={[styles.warn, { color: colors.expense }]}>
              SMS access is Android-only. On iOS and web you can still add transactions
              manually.
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={scan}
          disabled={scanning || !supported}
          style={[
            styles.scanButton,
            { backgroundColor: colors.primary, opacity: scanning || !supported ? 0.6 : 1 },
          ]}
        >
          {scanning ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>
                {scanned ? "Scan again" : "Scan messages"}
              </Text>
            </>
          )}
        </Pressable>

        {error ? (
          <Text style={[styles.error, { color: colors.expense }]}>{error}</Text>
        ) : null}

        {scanned && !error ? (
          items.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No new transactions found
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                Every M-Pesa message we could read is already imported or not a
                transaction.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.listHeader}>
                <Text style={[styles.listCount, { color: colors.textSecondary }]}>
                  {selected.size} of {items.length} selected
                </Text>
                <Pressable onPress={toggleAll} hitSlop={8}>
                  <Text style={[styles.selectAll, { color: colors.primary }]}>
                    {allSelected ? "Clear all" : "Select all"}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.card, styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {items.map((item) => {
                  const isSelected = selected.has(item.smsId);
                  const tint = item.direction === "income" ? colors.income : colors.expense;
                  return (
                    <Pressable
                      key={item.smsId}
                      onPress={() => toggle(item.smsId)}
                      style={[styles.row, { borderBottomColor: colors.border }]}
                    >
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={22}
                        color={isSelected ? colors.primary : colors.textFaint}
                      />
                      <View style={styles.rowBody}>
                        <Text numberOfLines={1} style={[styles.rowNote, { color: colors.text }]}>
                          {item.note}
                        </Text>
                        <View style={styles.rowMeta}>
                          <Text style={[styles.rowDate, { color: colors.textFaint }]}>
                            {format(fromISODate(item.date), "d MMM yyyy")}
                          </Text>
                          {item.isFuliza ? (
                            <View style={[styles.badge, { backgroundColor: `${colors.primary}22` }]}>
                              <Text style={[styles.badgeText, { color: colors.primary }]}>
                                Fuliza
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <Text style={[styles.rowAmount, { color: tint }]}>
                        {item.direction === "income" ? "+" : "-"}
                        {money(item.amount)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )
        ) : null}
      </ScrollView>

      {scanned && items.length > 0 ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <Pressable
            onPress={importSelected}
            style={[styles.importButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.importButtonText}>
              Import {selected.size} transaction{selected.size === 1 ? "" : "s"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  warn: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  listCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  selectAll: {
    fontSize: 14,
    fontWeight: "700",
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowNote: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  importButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
