import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compareVersions,
  isNewerVersion,
  parseVersion,
  versionCodeFor,
} from "./version.ts";

test("parseVersion accepts plain and v-prefixed versions", () => {
  assert.deepEqual(parseVersion("1.2.3"), { major: 1, minor: 2, patch: 3 });
  assert.deepEqual(parseVersion("v10.0.1"), { major: 10, minor: 0, patch: 1 });
  assert.deepEqual(parseVersion("v1.2.3-beta.1"), {
    major: 1,
    minor: 2,
    patch: 3,
  });
});

test("parseVersion rejects malformed input", () => {
  for (const bad of ["", "1.2", "latest", "v1.2.x", "1.2.3.4"]) {
    assert.equal(parseVersion(bad), null, bad);
  }
});

test("compareVersions compares numerically, not lexically", () => {
  assert.ok(isNewerVersion("v1.10.0", "1.9.0"));
  assert.ok(isNewerVersion("1.2.10", "1.2.9"));
  assert.ok(isNewerVersion("2.0.0", "1.99.99"));
  assert.equal(compareVersions("1.2.0", "v1.2.0"), 0);
  assert.equal(isNewerVersion("1.2.0", "1.2.0"), false);
  assert.equal(isNewerVersion("1.1.9", "1.2.0"), false);
});

test("an unparseable version is never treated as newer", () => {
  assert.equal(isNewerVersion("nightly", "1.2.0"), false);
  assert.equal(isNewerVersion("1.3.0", "dev"), false);
});

test("versionCodeFor matches the CI formula", () => {
  assert.equal(versionCodeFor("1.2.0"), 10200);
  assert.equal(versionCodeFor("v1.3.0"), 10300);
  assert.equal(versionCodeFor("oops"), null);
});
