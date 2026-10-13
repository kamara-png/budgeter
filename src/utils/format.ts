import { format } from "date-fns";
import { currency } from "@/constants/theme";

export const CURRENCY_SYMBOL = currency.symbol;

export function roundAmount(value: number): number {
  return Math.round(value);
}

function numberString(value: number): string {
  return Math.round(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

export function formatMoney(
  value: number,
  symbol: string = CURRENCY_SYMBOL,
): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}${symbol}${numberString(Math.abs(value))}`;
}

export function formatSigned(
  value: number,
  symbol: string = CURRENCY_SYMBOL,
): string {
  const abs = numberString(Math.abs(value));
  if (value < 0) return `-${symbol}${abs}`;
  if (value > 0) return `+${symbol}${abs}`;
  return `${symbol}${abs}`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1, (month ?? 1) - 1, day ?? 1);
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}