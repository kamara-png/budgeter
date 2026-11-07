import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionTitle } from "@/components/SectionTitle";
import { AppUpdateCard } from "@/components/updates/AppUpdateCard.native";
import { UpdateSheet } from "@/components/updates/UpdateSheet";
import { useTheme } from "@/hooks/useTheme";
import { useAppUpdate } from "@/store/useAppUpdate";
import {
  bundledChangelog,
  entryClosestTo,
  fetchRemoteChangelog,
  type ChangelogEntry,
} from "@/utils/updates";

type SheetState =
  | { open: false }
  | { open: true; loading: boolean; entry: ChangelogEntry | null };

function manifestCreatedAt(manifest: unknown): Date | null {
  if (!manifest || typeof manifest !== "object") return null;
  const createdAt = (manifest as { createdAt?: unknown }).createdAt;
  if (typeof createdAt !== "string") return null;
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function describeError(error: unknown): string {
  const raw =
    error instanceof Error && error.message
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  // Expo's own transport error is cryptic; say what actually went wrong.
  if (/failed to download remote update/i.test(raw)) {
    return "Couldn't download the update. Check your connection and try again.";
  }
  return raw || "Something went wrong while contacting the update server.";
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  return `${Math.floor(diff / 3_600_000)} hr ago`;
}

/**
 * Settings card for over-the-air updates. Native-only: the web build has no
 * expo-updates, so `UpdatesSection.web.tsx` is used there instead.
 */
export function UpdatesSection() {
  const { colors } = useTheme();
  const {
    checkError,
    downloadError,
    downloadProgress,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdatePending,
    lastCheckForUpdateTimeSinceRestart,
  } = Updates.useUpdates();

  const [sheet, setSheet] = useState<SheetState>({ open: false });
  const [error, setError] = useState<string | null>(null);
  const [localCheckedAt, setLocalCheckedAt] = useState<Date | null>(null);
  const appPhase = useAppUpdate((state) => state.phase);
  // Once a release is found, the app-update card reports its own errors.
  const appError = useAppUpdate((state) => (state.release ? null : state.error));

  const enabled = Updates.isEnabled;
  const version = Constants.expoConfig?.version ?? "";
  const channel = Updates.channel;

  const pending = enabled && isUpdatePending;
  const available = enabled && isUpdateAvailable && !pending;
  const checking = enabled && (isChecking || appPhase === "checking");
  const downloading = enabled && isDownloading;
  const progress = Math.min(
    100,
    Math.max(0, Math.round((downloadProgress ?? 0) * 100)),
  );
  const checkedAt = lastCheckForUpdateTimeSinceRestart ?? localCheckedAt;

  // The hook keeps the errors from the automatic launch check forever, so a
  // failed attempt hours ago would otherwise read like the app is broken.
  // Only surface them in the state they happened in; a manual check that
  // finds nothing ends in the "up to date" message below.
  const otaError = downloading
    ? null
    : (available || pending) && downloadError
      ? describeError(downloadError)
      : null;
  const localMessage =
    error ??
    otaError ??
    (checking && checkError ? describeError(checkError) : null) ??
    appError ??
    null;

  const openSheet = useCallback(async (createdAt: Date | null) => {
    setSheet({ open: true, loading: true, entry: null });
    const remote = await fetchRemoteChangelog();
    const source = remote.length > 0 ? remote : bundledChangelog;
    setSheet((current) =>
      current.open
        ? {
            open: true,
            loading: false,
            entry: entryClosestTo(source, createdAt),
          }
        : current,
    );
  }, []);

  const checkForUpdates = useCallback(async () => {
    setError(null);
    // A new APK release (native changes) is checked alongside the OTA bundle.
    void useAppUpdate.getState().check({ force: true });
    try {
      const result = await Updates.checkForUpdateAsync();
      setLocalCheckedAt(new Date());
      if (result.isAvailable) {
        await openSheet(manifestCreatedAt(result.manifest));
      }
    } catch (e) {
      // Expo raises raw transport errors ("Failed to download remote update")
      // when the update server can't be reached. No reachable update usually
      // just means nothing new, so report up to date instead of alarming the
      // user with network noise. The APK release check above still surfaces a
      // newer build it finds on GitHub.
      console.warn("OTA update check failed:", e);
      setLocalCheckedAt(new Date());
    }
  }, [openSheet]);

  const downloadUpdate = useCallback(async () => {
    setSheet({ open: false });
    setError(null);
    try {
      await Updates.fetchUpdateAsync();
    } catch (e) {
      setError(describeError(e));
    }
  }, []);

  const restartNow = useCallback(() => {
    Alert.alert(
      "Restart Budgeter?",
      "The app will close and reopen with the update you just downloaded.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Restart",
          onPress: () => {
            Updates.reloadAsync().catch((e: unknown) => {
              setError(describeError(e));
            });
          },
        },
      ],
    );
  }, []);

  const downloadFailed = available && otaError !== null;

  let statusText = "Check whether a newer version of the app is available.";
  let statusColor = colors.textSecondary;

  if (!enabled) {
    statusText =
      "Over-the-air updates only work in the installed app. Expo Go and dev builds load code from your computer, so there is nothing to update.";
  } else if (pending) {
    statusText = "Update downloaded — restart to apply it.";
    statusColor = colors.income;
  } else if (downloading) {
    statusText = `Downloading update… ${progress}%`;
  } else if (checking) {
    statusText = "Checking for updates…";
  } else if (downloadFailed) {
    statusText = localMessage ?? "Couldn't download the update.";
    statusColor = colors.danger;
  } else if (available) {
    statusText = "A new update is ready to download.";
  } else if (localMessage) {
    statusText = localMessage;
    statusColor = colors.danger;
  } else if (checkedAt) {
    statusText = `You're up to date · checked ${relativeTime(checkedAt)}`;
  }

  const buttonLabel = !enabled
    ? "Check for updates"
    : pending
      ? "Restart now"
      : downloading
        ? "Downloading…"
        : checking
          ? "Checking…"
          : available
            ? "Download update"
            : "Check for updates";

  const onPress = pending
    ? restartNow
    : available
      ? downloadUpdate
      : checkForUpdates;
  const buttonDisabled = !enabled || downloading || checking;

  return (
    <>
      <SectionTitle icon="cloud-download" title="Updates" />

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: `${colors.primary}1F` }]}>
            <Ionicons name="cloud-download" size={18} color={colors.primary} />
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: colors.text }]}>
              {version ? `Budgeter ${version}` : "App version"}
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {downloading ? (
          <View style={styles.progress}>
            <ProgressBar value={progress} limit={100} height={6} />
          </View>
        ) : null}

        <Pressable
          onPress={onPress}
          disabled={buttonDisabled}
          style={[
            styles.button,
            {
              backgroundColor: buttonDisabled ? colors.inputBg : colors.primary,
            },
          ]}
        >
          {checking || downloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={pending ? "refresh" : "cloud-download"}
              size={16}
              color={buttonDisabled ? colors.textFaint : "#FFFFFF"}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              { color: buttonDisabled ? colors.textFaint : "#FFFFFF" },
            ]}
          >
            {buttonLabel}
          </Text>
        </Pressable>

        {channel ? (
          <Text style={[styles.channel, { color: colors.textFaint }]}>
            {channel} channel
            {Updates.runtimeVersion ? ` · runtime ${Updates.runtimeVersion}` : ""}
          </Text>
        ) : null}
      </View>

      <AppUpdateCard />

      <UpdateSheet
        visible={sheet.open}
        loading={sheet.open ? sheet.loading : false}
        entry={sheet.open ? sheet.entry : null}
        onDownload={downloadUpdate}
        onClose={() => setSheet({ open: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  status: {
    fontSize: 13,
    lineHeight: 18,
  },
  progress: {
    paddingTop: 2,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  channel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
