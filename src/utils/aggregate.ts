import {
  addMonths,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  isYesterday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type {
  BudgetPeriod,
  BudgetRow,
  Category,
  CategoryTotal,
  DayGroup,
  Transaction,
} from "@/types";
import { fromISODate } from "@/utils/format";

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

function inMonth(t: Transaction, yearMonth: string): boolean {
  return t.date.slice(0, 7) === yearMonth;
}

export interface MonthTotals {
  spent: number;
  earned: number;
}

export function totalsInMonth(
  transactions: Transaction[],
  yearMonth: string,
): MonthTotals {
  let spent = 0;
  let earned = 0;
  for (const t of transactions) {
    if (!inMonth(t, yearMonth)) continue;
    if (t.type === "expense") spent += t.amount;
    else earned += t.amount;
  }
  return { spent, earned };
}

function spentByCategoryInMonth(
  transactions: Transaction[],
  yearMonth: string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!inMonth(t, yearMonth) || t.type !== "expense") continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
}

export function spendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  yearMonth: string,
): CategoryTotal[] {
  const spent = spentByCategoryInMonth(transactions, yearMonth);
  const byId = new Map(categories.map((c) => [c.id, c]));
  return Array.from(spent.entries())
    .map(([id, amount]) => ({ category: byId.get(id), amount }))
    .filter((entry): entry is CategoryTotal => entry.category !== undefined)
    .sort((a, b) => b.amount - a.amount);
}

export function spentForCategory(
  transactions: Transaction[],
  categoryId: string,
  yearMonth: string,
): number {
  return spentByCategoryInMonth(transactions, yearMonth).get(categoryId) ?? 0;
}

export function budgetRows(
  transactions: Transaction[],
  budgets: Record<string, number>,
  categories: Category[],
  yearMonth: string,
): BudgetRow[] {
  return categories
    .filter((c) => c.type === "expense" && (budgets[c.id] ?? 0) > 0)
    .map((category) => {
      const limit = budgets[category.id] ?? 0;
      const spent = spentForCategory(transactions, category.id, yearMonth);
      return { category, limit, spent, percent: limit > 0 ? spent / limit : 1 };
    })
    .sort((a, b) => b.percent - a.percent);
}

export interface OverallBudgetRow {
  period: BudgetPeriod;
  label: string;
  limit: number;
  spent: number;
}

function spentBetween(transactions: Transaction[], start: Date, end: Date): number {
  const from = start.getTime();
  const to = end.getTime();
  let sum = 0;
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const time = fromISODate(t.date).getTime();
    if (time >= from && time <= to) sum += t.amount;
  }
  return sum;
}

export function overallBudgetRows(
  transactions: Transaction[],
  overallBudgets: Record<BudgetPeriod, number>,
  now: Date = new Date(),
): OverallBudgetRow[] {
  const weekOpts = { weekStartsOn: 1 as const };
  const defs: { period: BudgetPeriod; label: string; start: Date; end: Date }[] = [
    { period: "daily", label: "Today", start: startOfDay(now), end: endOfDay(now) },
    {
      period: "weekly",
      label: "This week",
      start: startOfWeek(now, weekOpts),
      end: endOfWeek(now, weekOpts),
    },
    {
      period: "monthly",
      label: "This month",
      start: startOfMonth(now),
      end: endOfMonth(now),
    },
  ];
  return defs
    .map((d) => {
      const limit = overallBudgets[d.period] ?? 0;
      const spent = spentBetween(transactions, d.start, d.end);
      return { period: d.period, label: d.label, limit, spent };
    })
    .filter((r) => r.limit > 0);
}

function dayLabel(iso: string): string {
  const d = fromISODate(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMM yyyy");
}

export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const groups: DayGroup[] = [];
  for (const t of sorted) {
    const last = groups[groups.length - 1];
    const delta = t.type === "expense" ? -t.amount : t.amount;
    if (last && last.date === t.date) {
      last.items.push(t);
      last.total += delta;
    } else {
      groups.push({ date: t.date, label: dayLabel(t.date), total: delta, items: [t] });
    }
  }
  return groups;
}

export function monthlySeries(
  transactions: Transaction[],
  months = 6,
): { label: string; value: number }[] {
  const end = startOfMonth(new Date());
  const start = addMonths(end, -(months - 1));
  const list = eachMonthOfInterval({ start, end });
  return list.map((m) => {
    const key = monthKey(m);
    const { spent } = totalsInMonth(transactions, key);
    return { label: format(m, "MMM"), value: Math.round(spent) };
  });
}