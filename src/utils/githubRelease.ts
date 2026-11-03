import { parseVersion } from "./version.ts";

export interface AppRelease {
  /** Bare version, e.g. "1.3.0". */
  version: string;
  /** Git tag, e.g. "v1.3.0". */
  tag: string;
  publishedAt: string;
  /** Release page, for the "view on GitHub" fallback. */
  htmlUrl: string;
  apkUrl: string;
  apkName: string;
  /** Size in bytes as reported by GitHub; used to sanity-check the download. */
  apkSize: number;
}

/** Matches the asset the release workflow uploads: Budgeter-vX.Y.Z.apk. */
const APK_NAME = /^Budgeter-v\d+\.\d+\.\d+\.apk$/;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Turns a GitHub "latest release" API payload into an `AppRelease`, or null if
 * it is a draft, a pre-release, has a non-semver tag, or has no Budgeter APK.
 */
export function parseRelease(payload: unknown): AppRelease | null {
  if (!payload || typeof payload !== "object") return null;
  const release = payload as Record<string, unknown>;
  if (release.draft === true || release.prerelease === true) return null;

  const tag = asString(release.tag_name);
  const htmlUrl = asString(release.html_url);
  const publishedAt = asString(release.published_at);
  if (!tag || !htmlUrl || !publishedAt) return null;

  const parsed = parseVersion(tag);
  if (!parsed) return null;

  const assets = Array.isArray(release.assets) ? release.assets : [];
  for (const asset of assets) {
    if (!asset || typeof asset !== "object") continue;
    const entry = asset as Record<string, unknown>;
    const name = asString(entry.name);
    const url = asString(entry.browser_download_url);
    if (!name || !url || !APK_NAME.test(name)) continue;
    if (entry.state !== undefined && entry.state !== "uploaded") continue;

    return {
      version: `${parsed.major}.${parsed.minor}.${parsed.patch}`,
      tag,
      publishedAt,
      htmlUrl,
      apkUrl: url,
      apkName: name,
      apkSize: typeof entry.size === "number" ? entry.size : 0,
    };
  }
  return null;
}
