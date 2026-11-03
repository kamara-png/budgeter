import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import type { AppRelease } from "@/utils/githubRelease";

const APK_MIME = "application/vnd.android.package-archive";
/** Intent.FLAG_GRANT_READ_URI_PERMISSION — lets the installer read our content:// URI. */
const FLAG_GRANT_READ_URI_PERMISSION = 1;

/** Downloads `release`'s APK into the cache dir and returns its file:// URI. */
export async function downloadApk(
  release: AppRelease,
  onProgress: (percent: number) => void,
): Promise<string> {
  const directory = FileSystem.cacheDirectory;
  if (!directory) throw new Error("No cache directory is available.");

  await removeStaleApks(directory);
  const target = `${directory}${release.apkName}`;

  const task = FileSystem.createDownloadResumable(
    release.apkUrl,
    target,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const total = totalBytesExpectedToWrite || release.apkSize;
      if (total > 0) {
        onProgress(Math.min(100, Math.round((totalBytesWritten / total) * 100)));
      }
    },
  );

  const result = await task.downloadAsync();
  if (!result || result.status !== 200) {
    await FileSystem.deleteAsync(target, { idempotent: true });
    throw new Error(
      `Download failed${result ? ` (HTTP ${result.status})` : ""}. Try again.`,
    );
  }

  // Android verifies the APK's signature on install; this catches a truncated
  // download earlier, with a clearer message than "package appears invalid".
  const info = await FileSystem.getInfoAsync(target);
  if (
    !info.exists ||
    (release.apkSize > 0 && "size" in info && info.size !== release.apkSize)
  ) {
    await FileSystem.deleteAsync(target, { idempotent: true });
    throw new Error("The download was incomplete. Try again.");
  }

  onProgress(100);
  return target;
}

/** Hands a downloaded APK to Android's package installer. */
export async function installApk(fileUri: string): Promise<void> {
  const contentUri = await FileSystem.getContentUriAsync(fileUri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    type: APK_MIME,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
  });
}

/**
 * Opens this app's "Install unknown apps" screen. Android only asks for this
 * once, and the installer sends people there itself when it's missing, but
 * a direct shortcut saves hunting through Settings.
 */
export async function openInstallPermissionSettings(
  packageName: string,
): Promise<void> {
  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES,
    { data: `package:${packageName}` },
  );
}

async function removeStaleApks(directory: string): Promise<void> {
  try {
    const names = await FileSystem.readDirectoryAsync(directory);
    await Promise.all(
      names
        .filter((name) => /^Budgeter-v.*\.apk$/.test(name))
        .map((name) =>
          FileSystem.deleteAsync(`${directory}${name}`, { idempotent: true }),
        ),
    );
  } catch {
    // Cleanup is best-effort; a leftover APK is only wasted cache space.
  }
}
