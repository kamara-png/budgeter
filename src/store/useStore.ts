import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from "@/constants/currencies";
import { DEFAULT_ACCENT } from "@/constants/theme";
import type {
  BudgetPeriod,
  Category,
  Sim,
  ThemeMode,
  Transaction,
} from "@/types";
import { uid } from "@/utils/format";
import { ALL_SIMS } from "@/utils/sims";

export type NewTransactionInput = Omit<Transaction, "id" | "createdAt">;
export type NewCategoryInput = Omit<Category, "id">;
export type NewSimInput = Omit<Sim, "id">;

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  sims: Sim[];
  activeSimId: string;
  budgets: Record<string, Record<string, number>>;
  overallBudgets: Record<string, Record<BudgetPeriod, number>>;
  themeMode: ThemeMode;
  currency: Currency;
  accent: string;

  addTransaction: (input: NewTransactionInput) => void;
  updateTransaction: (id: string, patch: Partial<NewTransactionInput>) => void;
  deleteTransaction: (id: string) => void;
  addSim: (input: NewSimInput) => void;
  updateSim: (id: string, patch: Partial<NewSimInput>) => void;
  deleteSim: (id: string) => void;
  setActiveSim: (id: string) => void;
  setBudget: (simId: string, categoryId: string, amount: number) => void;
  setOverallBudget: (simId: string, period: BudgetPeriod, amount: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  addCategory: (input: NewCategoryInput) => void;
  updateCategory: (id: string, patch: Partial<NewCategoryInput>) => void;
  deleteCategory: (id: string) => void;
  setCurrency: (code: string) => void;
  setAccent: (hex: string) => void;
  clearAll: () => void;
}

const FIRST_SIM_ID = "sim-main";

const FIRST_SIM: Sim = {
  id: FIRST_SIM_ID,
  label: "Main SIM",
  number: "",
  color: DEFAULT_ACCENT,
};

const EMPTY_OVERALL: Record<BudgetPeriod, number> = {
  daily: 0,
  weekly: 0,
  monthly: 0,
};

type PersistedState = Partial<AppState> & {
  budgets?: unknown;
  overallBudgets?: unknown;
};

function isNumberMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([, v]) => typeof v === "number");
}

function isRecordOfRecords(value: unknown): value is Record<string, Record<string, number>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(
    (v) => v !== null && typeof v === "object" && !Array.isArray(v),
  );
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      sims: [FIRST_SIM],
      activeSimId: ALL_SIMS,
      budgets: {},
      overallBudgets: {},
      themeMode: "system",
      currency: DEFAULT_CURRENCY,
      accent: DEFAULT_ACCENT,

      addTransaction: (input) =>
        set((state) => ({
          transactions: [
            { ...input, id: uid(), createdAt: new Date().toISOString() },
            ...state.transactions,
          ],
        })),

      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      addSim: (input) =>
        set((state) => ({
          sims: [...state.sims, { ...input, id: `sim-${uid()}` }],
        })),

      updateSim: (id, patch) =>
        set((state) => ({
          sims: state.sims.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),

      deleteSim: (id) =>
        set((state) => {
          if (state.sims.length <= 1) return state;
          const sims = state.sims.filter((s) => s.id !== id);
          const fallbackId = sims[0].id;

          const budgets = { ...state.budgets };
          delete budgets[id];
          const overallBudgets = { ...state.overallBudgets };
          delete overallBudgets[id];

          return {
            sims,
            activeSimId: state.activeSimId === id ? ALL_SIMS : state.activeSimId,
            budgets,
            overallBudgets,
            transactions: state.transactions.map((t) =>
              t.simId === id ? { ...t, simId: fallbackId } : t,
            ),
          };
        }),

      setActiveSim: (activeSimId) => set({ activeSimId }),

      setBudget: (simId, categoryId, amount) =>
        set((state) => {
          const forSim = { ...(state.budgets[simId] ?? {}) };
          if (amount > 0) forSim[categoryId] = amount;
          else delete forSim[categoryId];
          return { budgets: { ...state.budgets, [simId]: forSim } };
        }),

      setOverallBudget: (simId, period, amount) =>
        set((state) => {
          const forSim = {
            ...EMPTY_OVERALL,
            ...(state.overallBudgets[simId] ?? {}),
            [period]: amount > 0 ? amount : 0,
          };
          return {
            overallBudgets: { ...state.overallBudgets, [simId]: forSim },
          };
        }),

      setThemeMode: (themeMode) => set({ themeMode }),

      addCategory: (input) =>
        set((state) => ({
          categories: [...state.categories, { ...input, id: `cat-${uid()}` }],
        })),

      updateCategory: (id, patch) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),

      deleteCategory: (id) =>
        set((state) => {
          const budgets: Record<string, Record<string, number>> = {};
          for (const [simId, map] of Object.entries(state.budgets)) {
            const copy = { ...map };
            delete copy[id];
            budgets[simId] = copy;
          }
          return {
            categories: state.categories.filter((c) => c.id !== id),
            budgets,
          };
        }),

      setCurrency: (code) =>
        set({
          currency:
            CURRENCIES.find((c) => c.code === code) ?? DEFAULT_CURRENCY,
        }),

      setAccent: (hex) => set({ accent: hex }),

      clearAll: () =>
        set({
          transactions: [],
          budgets: {},
          overallBudgets: {},
        }),
    }),
    {
      name: "budgeter-storage-v1",
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        categories: state.categories,
        sims: state.sims,
        activeSimId: state.activeSimId,
        budgets: state.budgets,
        overallBudgets: state.overallBudgets,
        themeMode: state.themeMode,
        currency: state.currency,
        accent: state.accent,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as PersistedState;
        const sims: Sim[] =
          Array.isArray(state.sims) && state.sims.length > 0
            ? state.sims
            : [FIRST_SIM];
        const primarySimId = sims[0].id;

        // v1 stored one flat budget map; attach it to the first SIM.
        const budgets: Record<string, Record<string, number>> =
          isNumberMap(state.budgets)
            ? { [primarySimId]: state.budgets }
            : isRecordOfRecords(state.budgets)
              ? (state.budgets as Record<string, Record<string, number>>)
              : {};

        const overallBudgets: Record<string, Record<BudgetPeriod, number>> =
          isNumberMap(state.overallBudgets)
            ? {
                [primarySimId]: {
                  ...EMPTY_OVERALL,
                  ...(state.overallBudgets as Partial<Record<BudgetPeriod, number>>),
                },
              }
            : (state.overallBudgets as
                | Record<string, Record<BudgetPeriod, number>>
                | undefined) ?? {};

        const transactions = (state.transactions ?? []).map((t) => ({
          ...t,
          simId: t.simId ?? primarySimId,
        }));

        const requestedSimId = state.activeSimId;
        const activeSimId =
          requestedSimId === ALL_SIMS ||
          (typeof requestedSimId === "string" &&
            sims.some((s) => s.id === requestedSimId))
            ? requestedSimId
            : ALL_SIMS;

        return {
          ...state,
          sims,
          activeSimId,
          budgets,
          overallBudgets,
          transactions,
        } as AppState;
      },
    },
  ),
);
