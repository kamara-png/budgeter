import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ProgressBar } from "@/components/ProgressBar";
import { ChangelogBody } from "@/components/updates/ChangelogBody";
import { useTheme } from "@/hooks/useTheme";
import { installedVersion, useAppUpdate } from "@/store/useAppUpdate";

/**
 * Launch-time prompt for a new APK release. The check itself runs at most once
 * a day and stays silent when offline or up to date. Declining ("Later") mutes
 * the prompt for that version; Settings → Updates still shows it.
 */
export function AppUpdatePrompt() {
  const { colors } = useTheme();
  const { phase, release, notes, progress, error, promptOpen } = useAppUpdate();

  useEffect(() => {
    const { hydrate, check } = useAppUpdate.getState();
    void hydrate().then(() => check());
  }, []);

  if (!promptOpen || !release) return null;

  const downloading = phase === "downloading";
  const installing = phase === "installing";
  const busy = downloading || installing;
  const published = new Date(release.publishedAt);

  const subtitle = [
    `Version ${release.version}`,
    Number.isNaN(published.getTime()) ? "" : format(published, "d MMM yyyy"),
  ]
    .filter(Boolean)
    .join(" · ");

  const { startUpdate, dismissPrompt } = useAppUpdate.getState();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) void dismissPrompt();
      }}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.badge, { backgroundColor: `${colors.primary}1F` }]}>
            <Ionicons name="arrow-up-circle" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Update available
          </Text>
          <Text style={[styles.subtitle, { color: colors.textFaint }]}>
            {subtitle} · you have {installedVersion()}
          </Text>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {notes ? (
              <ChangelogBody entry={notes} />
            ) : (
              <Text style={[styles.fallback, { color: colors.textSecondary }]}>
                Install to get the latest version. Your data stays on your phone.
              </Text>
            )}
          </ScrollView>

          {downloading ? (
            <View style={styles.progress}>
              <ProgressBar value={progress} limit={100} height={6} />
            </View>
          ) : null}

          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => void dismissPrompt()}
              disabled={busy}
              style={styles.ghost}
            >
              <Text style={[styles.ghostText, { color: colors.textSecondary }]}>
                Later
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void startUpdate()}
              disabled={busy}
              style={[
                styles.primary,
                { backgroundColor: busy ? colors.inputBg : colors.primary },
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="download" size={16} color="#FFFFFF" />
              )}
              <Text
                style={[
                  styles.primaryText,
                  { color: busy ? colors.textFaint : "#FFFFFF" },
                ]}
              >
                {downloading
                  ? `Downloading… ${progress}%`
                  : installing
                    ? "Opening installer…"
                    : error
                      ? "Try again"
                      : "Update"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 400, maxHeight: "85%", borderRadius: 24, padding: 22 },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 21, fontWeight: "800" },
  subtitle: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  body: { marginTop: 18, flexGrow: 0, flexShrink: 1 },
  bodyContent: { paddingBottom: 4 },
  fallback: { fontSize: 14, lineHeight: 20 },
  progress: { marginTop: 14 },
  error: { marginTop: 12, fontSize: 13, lineHeight: 18 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  ghost: { paddingHorizontal: 14, paddingVertical: 12 },
  ghostText: { fontSize: 15, fontWeight: "700" },
  primary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: { fontSize: 15, fontWeight: "700" },
});
