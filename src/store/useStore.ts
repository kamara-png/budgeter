import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from "@/constants/currencies";
import { DEFAULT_ACCENT } from "@/constants/theme";
import type { BudgetPeriod, Category, ThemeMode, Transaction } from "@/types";
import { uid } from "@/utils/format";

export type NewTransactionInput = Omit<Transaction, "id" | "createdAt">;
export type NewCategoryInput = Omit<Category, "id">;

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Record<string, number>;
  overallBudgets: Record<BudgetPeriod, number>;
  themeMode: ThemeMode;
  currency: Currency;
  accent: string;

  addTransaction: (input: NewTransactionInput) => void;
  updateTransaction: (id: string, patch: Partial<NewTransactionInput>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (categoryId: string, amount: number) => void;
  setOverallBudget: (period: BudgetPeriod, amount: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  addCategory: (input: NewCategoryInput) => void;
  updateCategory: (id: string, patch: Partial<NewCategoryInput>) => void;
  deleteCategory: (id: string) => void;
  setCurrency: (code: string) => void;
  setAccent: (hex: string) => void;
  clearAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgets: {},
      overallBudgets: { daily: 0, weekly: 0, monthly: 0 },
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

      setBudget: (categoryId, amount) =>
        set((state) => {
          const budgets = { ...state.budgets };
          if (amount > 0) budgets[categoryId] = amount;
          else delete budgets[categoryId];
          return { budgets };
        }),

      setOverallBudget: (period, amount) =>
        set((state) => ({
          overallBudgets: {
            ...state.overallBudgets,
            [period]: amount > 0 ? amount : 0,
          },
        })),

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
          const budgets = { ...state.budgets };
          delete budgets[id];
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
          overallBudgets: { daily: 0, weekly: 0, monthly: 0 },
        }),
    }),
    {
      name: "budgeter-storage-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        overallBudgets: state.overallBudgets,
        themeMode: state.themeMode,
        currency: state.currency,
        accent: state.accent,
      }),
    },
  ),
);