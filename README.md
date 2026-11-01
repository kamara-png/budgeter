# Budgeter 💸

A local-first expense & budget tracker built with **React Native + Expo Router** and **TypeScript**. Track expenses and income, set monthly budgets per category, and visualise spending with charts — all stored on your device.

Built as a portfolio project to demonstrate: Expo/React Native development, file-based routing, local persistence, state management, data visualisation, and theming.

## Features

- **Track transactions** — add, edit, and delete expenses and income with amount, category, date, and note.
- **Dashboard** — this month's spending, income, and net with leftover budget at a glance.
- **Category budgets** — set a monthly limit per category and watch live progress bars (warning turns red when you go over).
- **Search & filters** — filter by day, search notes/categories, and narrow by income vs. expense.
- **Stats & charts** — donut chart of spending by category and a 6-month bar chart, browsable by month.
- **Dark mode** — Light, Dark, or System theme.
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

Releases are built and published by GitHub Actions (`.github/workflows/build.yml`). Pushing a `v*` tag runs lint/typecheck/doctor, builds a signed Android APK, and attaches it to a new GitHub Release:

```bash
npm version patch          # bumps version, commits, creates tag (use minor/major as needed)
git push --follow-tags     # pushes the commit and the tag
```

Or create the tag by hand:

```bash
git tag v1.0.1
git push origin v1.0.1
```

The tag name becomes the release name and the app version baked into the APK. You can also run the workflow manually from **Actions → Build & Release → Run workflow**; manual runs only upload the APK as a workflow artifact and do not create a release.

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
- Multiple wallets/accounts
- Biometric lock
- Custom categories

## Screenshots

_TODO: add screenshots here. Grab them from Expo Go and drop the images into the repo._

## License

MIT