import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { formatMoney, formatSigned } from "@/utils/format";

export function useMoney() {
  const symbol = useStore((s) => s.currency.symbol);
  return useMemo(
    () => ({
      money: (value: number) => formatMoney(value, symbol),
      signed: (value: number) => formatSigned(value, symbol),
    }),
    [symbol],
  );
}
