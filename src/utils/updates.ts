import AsyncStorage from "@react-native-async-storage/async-storage";
import changelog from "@/constants/changelog.json";

export interface ChangelogEntry {
  version: string;
  /** ISO 8601 timestamp, e.g. "2026-11-02T10:00:00Z". */
  publishedAt: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
}

export const CHANGELOG_URL =
  "https://raw.githubusercontent.com/kamara-png/budgeter/main/src/constants/changelog.json";

const LAST_SEEN_UPDATE_ID_KEY = "budgeter.lastSeenUpdateId";
const REMOTE_TIMEOUT_MS = 5000;

/**
 * The changelog that shipped inside this build. This is the fallback whenever
 * the remote copy can't be reached, and the source of truth for "what's new"
 * after an over-the-air update is applied.
 */
export const bundledChangelog: ChangelogEntry[] = changelog;

function isChangelogEntry(value: unknown): value is ChangelogEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.version === "string" &&
    typeof entry.publishedAt === "string" &&
    !Number.isNaN(Date.parse(entry.publishedAt))
  );
}

function normalizeChangelog(value: unknown): ChangelogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isChangelogEntry);
}

/** The most recently published entry. */
export function newestEntry(
  entries: ChangelogEntry[] = bundledChangelog,
): ChangelogEntry | null {
  let newest: ChangelogEntry | null = null;
  for (const entry of entries) {
    if (
      !newest ||
      Date.parse(entry.publishedAt) > Date.parse(newest.publishedAt)
    ) {
      newest = entry;
    }
  }
  return newest;
}

/**
 * The entry whose `publishedAt` is closest to `date`. Used to match a freshly
 * published OTA update (which only has a creation timestamp) to its changelog.
 * Falls back to the newest entry when no usable date is available.
 */
export function entryClosestTo(
  entries: ChangelogEntry[],
  date: Date | null | undefined,
): ChangelogEntry | null {
  if (entries.length === 0) return null;
  if (!date || Number.isNaN(date.getTime())) return newestEntry(entries);

  let best: ChangelogEntry | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const entry of entries) {
    const delta = Math.abs(Date.parse(entry.publishedAt) - date.getTime());
    if (delta < bestDelta) {
      best = entry;
      bestDelta = delta;
    }
  }
  return best;
}

/**
 * Best-effort fetch of the changelog committed on `main`. Resolves to an empty
 * array on any failure (offline, timeout, bad payload) so callers can always
 * fall back to the bundled copy instead of blocking.
 */
export async function fetchRemoteChangelog(): Promise<ChangelogEntry[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);

  try {
    const response = await fetch(CHANGELOG_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    return normalizeChangelog(await response.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** The id of the last update whose "what's new" sheet has been dismissed. */
export async function getLastSeenUpdateId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SEEN_UPDATE_ID_KEY);
  } catch {
    return null;
  }
}

export async function markUpdateSeen(updateId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SEEN_UPDATE_ID_KEY, updateId);
  } catch {
    // Storage being unavailable shouldn't block the user; worst case the
    // "what's new" sheet shows again on the next launch.
  }
}
