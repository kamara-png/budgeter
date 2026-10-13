import type { MpesaRawMessage } from "../../modules/mpesa-sms";
import type { NewTransactionInput } from "@/store/useStore";
import type { TransactionType } from "@/types";
import { toISODate } from "@/utils/format";

export interface ParsedMpesaMessage {
  smsId: string;
  direction: TransactionType;
  amount: number;
  cost: number;
  balance?: number;
  counterparty?: string;
  reference?: string;
  note: string;
  date: string;
  isFuliza: boolean;
  rawBody: string;
}

const AMOUNT_PATTERN = /Ksh\s?([\d,]+(?:\.\d{1,2})?)/i;
const COST_PATTERN =
  /(?:transaction cost|charge[d]?)[,:]?\s*Ksh\s?([\d,]+(?:\.\d{1,2})?)/i;
const BALANCE_PATTERN =
  /(?:new\s+)?(?:m-?pesa\s+)?balance\s+is\s+Ksh\s?([\d,]+(?:\.\d{1,2})?)/i;
const DATE_PATTERN =
  /on\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+at\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i;

const INCOME_PATTERN =
  /(you have received|received from|has been credited|credited to your|deposited into)/i;
const EXPENSE_PATTERN =
  /(sent to|paid to|withdrawn|you bought|bought .*airtime|airtime purchase|pay bill|paid via)/i;

function parseKsh(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractParty(body: string): string | undefined {
  const match = body.match(
    /(?:sent to|received from|paid to|withdrawn from)\s+([A-Za-z0-9'&@.\- ]{2,60})/i,
  );
  if (!match) return undefined;
  const party = match[1]
    .replace(/\s+for account.*$/i, "")
    .replace(/\s+\d[\d\s]{5,}.*$/, "")
    .replace(/[.,\s]+$/, "")
    .trim();
  return party.length >= 2 ? party : undefined;
}

function parseSmsDate(body: string, fallbackMs: number): string {
  const match = body.match(DATE_PATTERN);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    let hour = Number(match[4]);
    const minute = Number(match[5]);
    const meridian = match[6]?.toLowerCase();
    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;
    const parsed = new Date(year, month - 1, day, hour, minute);
    if (!Number.isNaN(parsed.getTime())) return toISODate(parsed);
  }
  return toISODate(new Date(fallbackMs));
}

/**
 * Best-effort parser for Safaricom M-Pesa confirmation SMS. Returns `null` for
 * messages that are not recognisable transactions (promos, balance-only alerts...).
 */
export function parseMpesaMessage(
  message: MpesaRawMessage,
): ParsedMpesaMessage | null {
  const body = message.body.replace(/\s+/g, " ").trim();

  if (!/(confirmed|m-?pesa|fuliza)/i.test(body)) return null;

  const income = INCOME_PATTERN.test(body);
  const expense = EXPENSE_PATTERN.test(body);
  if (!income && !expense) return null;

  const amount = parseKsh(body.match(AMOUNT_PATTERN)?.[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const direction: TransactionType = income && !expense ? "income" : "expense";
  const counterparty = extractParty(body);
  const reference = body.match(/^([A-Z0-9]{8,16})\s+confirmed/i)?.[1];
  const balance = parseKsh(body.match(BALANCE_PATTERN)?.[1]) || undefined;
  const cost = parseKsh(body.match(COST_PATTERN)?.[1]);

  const noteParts = [
    counterparty,
    reference ? `Ref ${reference}` : undefined,
  ].filter(Boolean);

  return {
    smsId: message.id,
    direction,
    amount,
    cost,
    balance,
    counterparty,
    reference,
    note:
      noteParts.join(" · ") ||
      (direction === "income" ? "M-Pesa received" : "M-Pesa payment"),
    date: parseSmsDate(body, message.date),
    isFuliza: /fuliza/i.test(body),
    rawBody: body,
  };
}

export function mpesaCategoryId(direction: TransactionType): string {
  return direction === "income" ? "inc-mpesa" : "exp-mpesa";
}

export function toTransactionInput(item: ParsedMpesaMessage): NewTransactionInput {
  return {
    type: item.direction,
    amount: Math.round(item.amount),
    categoryId: mpesaCategoryId(item.direction),
    date: item.date,
    note: item.note,
  };
}
