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