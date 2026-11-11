import type { BudgetPeriod, Sim, Transaction } from "@/types";

export const ALL_SIMS = "all";

/** The SIM ids included in the current view ("all" means every SIM). */
export function simScopeIds(sims: Sim[], activeSimId: string): string[] {
  if (activeSimId === ALL_SIMS) return sims.map((s) => s.id);
  return sims.some((s) => s.id === activeSimId)
    ? [activeSimId]
    : sims.map((s) => s.id);
}

/** Transactions that belong to the selected SIM, or all of them. */
export function transactionsForSim(
  transactions: Transaction[],
  activeSimId: string,
): Transaction[] {
  if (activeSimId === ALL_SIMS) return transactions;
  return transactions.filter((t) => t.simId === activeSimId);
}

/** Sum the per-SIM category budgets for the SIMs in scope. */
export function mergeCategoryBudgets(
  budgets: Record<string, Record<string, number>>,
  simIds: string[],
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const simId of simIds) {
    const map = budgets[simId];
    if (!map) continue;
    for (const [categoryId, amount] of Object.entries(map)) {
      if (amount > 0) merged[categoryId] = (merged[categoryId] ?? 0) + amount;
    }
  }
  return merged;
}

/** Sum the per-SIM overall budgets for the SIMs in scope. */
export function mergeOverallBudgets(
  overallBudgets: Record<string, Record<BudgetPeriod, number>>,
  simIds: string[],
): Record<BudgetPeriod, number> {
  const merged: Record<BudgetPeriod, number> = {
    daily: 0,
    weekly: 0,
    monthly: 0,
  };
  for (const simId of simIds) {
    const map = overallBudgets[simId];
    if (!map) continue;
    merged.daily += map.daily ?? 0;
    merged.weekly += map.weekly ?? 0;
    merged.monthly += map.monthly ?? 0;
  }
  return merged;
}

export interface FulizaTotals {
  limit: number;
  outstanding: number;
}

/** Sum the Fuliza limits and outstanding amounts for the SIMs in scope. */
export function mergeFuliza(
  fuliza: Record<string, { limit: number; outstanding: number }>,
  simIds: string[],
): FulizaTotals {
  const merged: FulizaTotals = { limit: 0, outstanding: 0 };
  for (const simId of simIds) {
    const info = fuliza[simId];
    if (!info) continue;
    merged.limit += info.limit ?? 0;
    merged.outstanding += info.outstanding ?? 0;
  }
  return merged;
}
