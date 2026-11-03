import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ProgressBar } from "@/components/ProgressBar";
import { ChangelogBody } from "@/components/updates/ChangelogBody";
import { useTheme } from "@/hooks/useTheme";
import { installedVersion, useAppUpdate } from "@/store/useAppUpdate";
import { openInstallPermissionSettings } from "@/utils/apkInstaller";

const FALLBACK_PACKAGE = "com.kamarack.budgeter";

/**
 * Settings card for a new APK release: native changes that an over-the-air
 * update can't carry. Hidden until a newer GitHub release is found.
 */
export function AppUpdateCard() {
  const { colors } = useTheme();
  const { phase, release, notes, progress, error, startUpdate } = useAppUpdate();

  if (!release || (phase !== "available" && phase !== "downloading" && phase !== "installing")) {
    return null;
  }

  const downloading = phase === "downloading";
  const installing = phase === "installing";
  const busy = downloading || installing;

  const buttonLabel = downloading
    ? `Downloading… ${progress}%`
    : installing
      ? "Opening installer…"
      : error
        ? "Try again"
        : "Download & install";

  const allowInstalls = () => {
    const packageName = Constants.expoConfig?.android?.package ?? FALLBACK_PACKAGE;
    openInstallPermissionSettings(packageName).catch(() => {
      // Some Android skins don't expose this screen; the installer prompts instead.
    });
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.primary },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: `${colors.primary}1F` }]}>
          <Ionicons name="arrow-up-circle" size={20} color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>
            Budgeter {release.version} is available
          </Text>
          <Text style={[styles.subtitle, { color: colors.textFaint }]}>
            You have {installedVersion()} · installs over your current app, your
            data stays
          </Text>
        </View>
      </View>

      {notes ? (
        <ChangelogBody entry={notes} />
      ) : (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Release notes are on the GitHub release page.
        </Text>
      )}

      {downloading ? <ProgressBar value={progress} limit={100} height={6} /> : null}

      {error ? (
        <Text style={[styles.hint, { color: colors.danger }]}>{error}</Text>
      ) : null}

      <Pressable
        onPress={startUpdate}
        disabled={busy}
        style={[
          styles.button,
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
            styles.buttonText,
            { color: busy ? colors.textFaint : "#FFFFFF" },
          ]}
        >
          {buttonLabel}
        </Text>
      </Pressable>

      <Pressable onPress={allowInstalls} disabled={busy} style={styles.link}>
        <Text style={[styles.linkText, { color: colors.textSecondary }]}>
          Android asks once to allow installs from Budgeter · open that setting
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, lineHeight: 17 },
  hint: { fontSize: 13, lineHeight: 18 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
  link: { alignItems: "center", paddingVertical: 2 },
  linkText: { fontSize: 12, textAlign: "center", textDecorationLine: "underline" },
});
