# Releasing Budgeter

One page from merged code to an installed update. The design follows [Tripwire](https://github.com/trononly/tripwire)'s release process, adapted to Expo.

## Model

- `main` is always releasable. CI (`ci.yml`) runs on every pull request and gates both the OTA publish and the APK build.
- A release is an **annotated** `vX.Y.Z` tag on a commit on `main`. The tag is the version; `scripts/release.mjs` keeps `app.json`, `package.json` and the lockfile in step with it.
- Release notes live in `src/constants/changelog.json`. The same entry is the in-app "What's new" and the GitHub Release body. The build fails if it's missing.
- Never move or delete a published tag. If a release is broken, ship `X.Y.(Z+1)`.

## Versioning

Semantic versioning, `major.minor.patch`:

- **Patch**: fixes and copy changes.
- **Minor**: new features, backwards compatible.
- **Major**: breaking changes or anything users must act on.

`versionCode` is derived from the version (`major * 10000 + minor * 100 + patch`; `1.3.0` → `10300`), so keep minor and patch under 100. It must strictly increase for every published build; Android won't install a lower code over a higher one.

## Native changes need a new version

`runtimeVersion` is the app version, so an OTA update only reaches builds with the same version. If a change adds, removes or upgrades anything with native code (an `expo-*` or `react-native-*` module, a config plugin, `app.json` native fields), **bump the version in the same pull request**. Otherwise the OTA publish lands on builds that lack the native module and crashes them.

## Release day

1. `git switch main && git pull --ff-only`
2. Confirm CI is green on `main`.
3. Draft notes: `node scripts/draft-release-notes.mjs X.Y.Z`
4. Edit the new entry in `src/constants/changelog.json`. Group related changes, drop internal details, order by what users notice. The draft is a starting point, not the copy.
5. Commit the notes (through a PR if `main` is protected) and merge.
6. `node scripts/release.mjs X.Y.Z` (or `patch` / `minor` / `major`). Use `--dry-run` first to see the checks pass. It refuses to run with a dirty tree, off `main`, with a reused tag, or without notes.
7. `git push origin main && git push origin vX.Y.Z`
8. Watch **Build & Release**. It re-runs the checks, builds and verifies the signed APK, and publishes the GitHub Release.
9. On a real phone with the previous version installed, open Budgeter → **Settings → Updates → Check for updates**. Confirm the update card shows the new notes, the download completes, the installer opens, and your data survived. (Builds before 1.3.0 can't self-update; install `1.3.0` manually once.)

## Hotfixes

If `main` has no unreleased work, fix through a PR and release the next patch. If `main` has moved on, branch from the old tag (`git switch -c release/1.3 v1.3.0`), fix, tag `v1.3.1` from that branch, and merge the fix back to `main`.

## Signing

Every APK is signed with the keystore in `android-signing/` (see its README for why it is committed and why it must be backed up). CI verifies the signature and the 50 MiB size cap before publishing. Android refuses to update an installed app signed with a different key, so never change it.

## Checklist

- [ ] CI green on `main`
- [ ] Version chosen per SemVer; native changes → version bumped
- [ ] Changelog entry written for users, not copied from commit subjects
- [ ] `node scripts/release.mjs … --dry-run` passes
- [ ] Annotated tag pushed
- [ ] Release workflow green; GitHub Release shows the changelog entry
- [ ] Installed the APK over the previous version; data intact
- [ ] In-app update card offered the new version with its notes
