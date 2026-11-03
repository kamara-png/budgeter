# Budgeter 💸

A local-first expense & budget tracker built with **React Native + Expo Router** and **TypeScript**. Track expenses and income, set monthly budgets per category, and visualise spending with charts — all stored on your device.

Built as a portfolio project to demonstrate: Expo/React Native development, file-based routing, local persistence, state management, data visualisation, and theming.

## Features

- **Track transactions** — add, edit, and delete expenses and income with amount, category, date, and note.
- **Dashboard** — this month's spending, income, and net with leftover budget at a glance.
- **Category budgets** — set a monthly limit per category and watch live progress bars (warning turns red when you go over).
- **Multiple SIM cards** — keep separate transactions and budgets for each phone number, with an All SIMs view that adds them together.
- **Search & filters** — filter by day, search notes/categories, and narrow by income vs. expense.
- **Stats & charts** — donut chart of spending by category and a 6-month bar chart, browsable by month.
- **Dark mode** — Light, Dark, or System theme.
- **Updates inside the app** — JavaScript fixes arrive over the air; new versions download and install from Settings → Updates (checked once a day on launch), with the changelog shown first.
- **Local only** — everything persists on-device behind `AsyncStorage` (via Zustand `persist`); no accounts, no server.

## Tech stack

| Area        | Choice                                    |
|-------------|-------------------------------------------|
| Framework   | Expo SDK 57, React Native 0.86            |
| Language    | TypeScript (strict)                       |
| Navigation  | Expo Router (file-based, `src/app`)       |
| State       | Zustand + persist (AsyncStorage)          |
| Charts      | react-native-gifted-charts + SVG          |
| Dates       | date-fns                                  |
| Icons       | @expo/vector-icons (Ionicons)             |

## Download

Grab the latest Android build from the [**Releases page**](https://github.com/kamara-png/budgeter/releases/latest).

1. Download the `Budgeter-vX.Y.Z.apk` file **on your phone**.
2. Tap it in your downloads and allow "install unknown apps" when prompted.
3. Open **Budgeter** from your app drawer.

Updates install over the top of the previous version. iOS builds are not published here — Apple does not allow installing arbitrary `.ipa` files, so use Expo Go (`npm start`) or an EAS internal/TestFlight build on iOS.

## Releasing

Releases are built and published by GitHub Actions. The short version (full checklist in [`RELEASING.md`](RELEASING.md)):

```bash
node scripts/draft-release-notes.mjs 1.3.1   # drafts src/constants/changelog.json from commits
# edit the entry: group, dedupe, write it for users
node scripts/release.mjs 1.3.1               # checks, bumps versions, commits, creates annotated tag v1.3.1
git push origin main && git push origin v1.3.1
```

Pushing the `v*` tag runs the CI checks, builds a signed Android APK, and publishes a GitHub Release whose notes are the changelog entry for that version, verbatim. The build fails if the entry is missing, so the GitHub Release and the in-app "What's new" always match. `workflow_dispatch` runs only upload the APK as a workflow artifact.

### Signing and size

Every APK is signed with the keystore committed in `android-signing/` (wired in by `plugins/withReleaseSigning.js`), so new versions install over old ones instead of failing with a signature mismatch. Before uploading, CI runs `apksigner verify` and fails the build if the APK is unsigned, signed by a different key, or larger than **50 MiB**.

Builds ship `arm64-v8a` and `armeabi-v7a` only, with R8 minification, resource shrinking, and bundle compression enabled (`expo-build-properties` in `app.json`). The keystore is public by design — see `android-signing/README.md` for the trade-off and why it must be backed up.

### How installed apps get updates

There are two channels, and they cover different things:

| Channel | Carries | Trigger | Installed app |
|---|---|---|---|
| **Over-the-air** (EAS Update) | JavaScript and assets only | push to `main`, after CI passes (`update.yml`) | downloads on launch, restart to apply |
| **New APK** (GitHub Releases) | anything, including native changes | push a `v*` tag (`build.yml`) | checks once a day on launch (and from **Settings → Updates**), downloads the APK, opens Android's installer |

`runtimeVersion` follows the app version, so an OTA update only reaches builds with the same version. **If a change adds or upgrades a native module, bump the version in the same change** — otherwise the OTA update lands on older builds that don't have the module and crashes them. Every release is a new runtime, which is why new versions arrive as an APK.

- The build fails if the tag and `app.json` disagree.
- Every release needs an entry in `src/constants/changelog.json`; the in-app sheets and the GitHub Release both read from it.
- The OTA workflow needs an `EXPO_TOKEN` repository secret ([create one](https://expo.dev/settings/access-tokens)).
- The first install of a build with the in-app installer asks you to allow "Install unknown apps" for Budgeter once. That is Android's rule for apps installed outside the Play Store.

## Getting started

```bash
npm install
npm start          # then scan the QR code with Expo Go
npm run web        # or run in the browser
```

> Tip: with Expo Go you can run the same code on Android and iOS instantly — no native build required.

## Scripts

```bash
npm start          # start the dev server
npm run web        # start with web support
npm run android    # start and open on Android
npm run ios        # start and open on iOS (macOS only)
npx tsc --noEmit   # typecheck
npx eslint .       # lint
npx expo-doctor    # dependency/config health check
```

## Project structure

```
src/
├── app/                    # Expo Router routes (every file is a screen)
│   ├── _layout.tsx         # Root stack + theme
│   ├── (tabs)/             # Bottom-tab group
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # Home dashboard
│   │   ├── transactions.tsx
│   │   ├── stats.tsx
│   │   └── settings.tsx
│   └── transaction/[id].tsx  # Add/Edit modal ("new" = create)
├── components/             # AmountInput, CategoryPicker, DatePicker, charts UI, etc.
├── constants/              # Theme colors, default categories
├── hooks/                  # useTheme (Store + system color scheme)
├── store/                  # Zustand store + persistence
├── types/                  # Shared TypeScript types
└── utils/                  # money/date formatting, aggregations
```

## Roadmap ideas

- Recurring transactions
- Export to CSV
- Biometric lock
- Per-SIM monthly reports

## Screenshots

_TODO: add screenshots here. Grab them from Expo Go and drop the images into the repo._

## License

MIT