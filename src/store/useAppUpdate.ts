import Constants from "expo-constants";
import { Platform } from "react-native";
import { create } from "zustand";
import {
  checkLatestRelease,
  getDismissedVersion,
  isAutoCheckDue,
  readCache,
  setDismissedVersion,
} from "@/utils/appUpdate";
import { downloadApk, installApk } from "@/utils/apkInstaller";
import type { AppRelease } from "@/utils/githubRelease";
import type { ChangelogEntry } from "@/utils/updates";
import { isNewerVersion } from "@/utils/version";

export type AppUpdatePhase =
  | "idle"
  | "checking"
  | "upToDate"
  | "available"
  | "downloading"
  | "installing";

interface AppUpdateState {
  phase: AppUpdatePhase;
  release: AppRelease | null;
  notes: ChangelogEntry | null;
  /** 0–100 while downloading. */
  progress: number;
  error: string | null;
  checkedAt: number | null;
  /** Whether the launch prompt should be on screen. */
  promptOpen: boolean;

  /** Loads the cached check result so an update shows instantly, even offline. */
  hydrate: () => Promise<void>;
  /** `force` is a manual check; otherwise it is the throttled launch check. */
  check: (options?: { force?: boolean }) => Promise<void>;
  /** Downloads the APK and opens Android's installer. */
  startUpdate: () => Promise<void>;
  /** "Later" on the launch prompt: stay quiet about this version until the next one. */
  dismissPrompt: () => Promise<void>;
}

/** The installed binary's version. OTA updates never change it. */
export function installedVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

/** The installer only exists on Android, and dev builds load code from a PC. */
export const appUpdatesSupported = Platform.OS === "android" && !__DEV__;

function message(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while updating.";
}

export const useAppUpdate = create<AppUpdateState>((set, get) => ({
  phase: "idle",
  release: null,
  notes: null,
  progress: 0,
  error: null,
  checkedAt: null,
  promptOpen: false,

  hydrate: async () => {
    if (!appUpdatesSupported) return;
    const cache = await readCache();
    if (!cache) return;
    const newer =
      cache.release && isNewerVersion(cache.release.version, installedVersion());
    set((state) =>
      state.phase === "idle"
        ? {
            phase: newer ? "available" : "idle",
            release: newer ? cache.release : null,
            notes: newer ? cache.notes : null,
            checkedAt: cache.checkedAt,
          }
        : state,
    );
  },

  check: async ({ force = false } = {}) => {
    if (!appUpdatesSupported) return;
    const { phase } = get();
    if (phase === "checking" || phase === "downloading" || phase === "installing") {
      return;
    }
    if (!force && !(await isAutoCheckDue())) return;

    const previous = phase;
    set({ phase: "checking", error: null });
    try {
      const cache = await checkLatestRelease();
      const release = cache.release;
      const newer = !!release && isNewerVersion(release.version, installedVersion());

      if (!release || !newer) {
        set({
          phase: "upToDate",
          release: null,
          notes: null,
          checkedAt: cache.checkedAt,
        });
        return;
      }

      const dismissed = await getDismissedVersion();
      set({
        phase: "available",
        release,
        notes: cache.notes,
        checkedAt: cache.checkedAt,
        promptOpen: !force && dismissed !== release.version,
      });
    } catch (error) {
      // A failed background check stays silent; only a manual one reports it.
      set({
        phase: previous,
        error: force ? message(error) : null,
      });
    }
  },

  startUpdate: async () => {
    const { release, phase } = get();
    if (!release || phase === "downloading" || phase === "installing") return;

    set({ phase: "downloading", progress: 0, error: null });
    try {
      const fileUri = await downloadApk(release, (progress) => set({ progress }));
      set({ phase: "installing" });
      await installApk(fileUri);
      // The call returns once the installer closes. If we're still running,
      // the install was cancelled or blocked, so offer it again.
      set({ phase: "available" });
    } catch (error) {
      set({ phase: "available", error: message(error) });
    }
  },

  dismissPrompt: async () => {
    const { release } = get();
    set({ promptOpen: false });
    if (release) await setDismissedVersion(release.version);
  },
}));
