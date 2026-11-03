import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRelease } from "./githubRelease.ts";

const base = {
  tag_name: "v1.3.0",
  html_url: "https://github.com/kamara-png/budgeter/releases/tag/v1.3.0",
  published_at: "2026-11-03T10:00:00Z",
  draft: false,
  prerelease: false,
  assets: [
    {
      name: "Budgeter-v1.3.0.apk",
      browser_download_url:
        "https://github.com/kamara-png/budgeter/releases/download/v1.3.0/Budgeter-v1.3.0.apk",
      size: 41_000_000,
      state: "uploaded",
    },
  ],
};

test("parses a normal release", () => {
  const release = parseRelease(base);
  assert.equal(release?.version, "1.3.0");
  assert.equal(release?.apkName, "Budgeter-v1.3.0.apk");
  assert.equal(release?.apkSize, 41_000_000);
});

test("ignores drafts and pre-releases", () => {
  assert.equal(parseRelease({ ...base, draft: true }), null);
  assert.equal(parseRelease({ ...base, prerelease: true }), null);
});

test("ignores releases without the Budgeter APK", () => {
  assert.equal(parseRelease({ ...base, assets: [] }), null);
  assert.equal(
    parseRelease({
      ...base,
      assets: [{ name: "apk.sha256", browser_download_url: "https://x/y" }],
    }),
    null,
  );
});

test("ignores assets that are still uploading", () => {
  const assets = [{ ...base.assets[0], state: "starter" }];
  assert.equal(parseRelease({ ...base, assets }), null);
});

test("rejects non-semver tags and garbage payloads", () => {
  assert.equal(parseRelease({ ...base, tag_name: "nightly" }), null);
  assert.equal(parseRelease(null), null);
  assert.equal(parseRelease("nope"), null);
});
