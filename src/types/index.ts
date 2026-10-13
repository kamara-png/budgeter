import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type TransactionType = "expense" | "income";
export type ThemeMode = "light" | "dark" | "system";
export type BudgetPeriod = "daily" | "weekly" | "monthly";

export interface Category {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // yyyy-MM-dd
  note?: string;
  createdAt: string;
}

export interface DayGroup {
  date: string;
  label: string;
  total: number;
  items: Transaction[];
}

export interface BudgetRow {
  category: Category;
  limit: number;
  spent: number;
  percent: number;
}

export interface CategoryTotal {
  category: Category;
  amount: number;
}