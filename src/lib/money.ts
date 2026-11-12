/* Money & category helpers (same as the original app.js, section 4).
   Every amount is STORED in RSD; these turn it into the chosen currency. */

import { CURRENCIES } from "../config/defaults";
import type { Category, CurrencyCode, Transaction } from "../types";

export function getCurrency(code: CurrencyCode) {
  return CURRENCIES[code] || CURRENCIES.RSD;
}

/** RSD amount → text in the selected currency, e.g. "-1.800 RSD" or "$17.82" */
export function formatMoney(
  amountRSD: number,
  code: CurrencyCode,
  { showPlus = false } = {},
): string {
  const currency = getCurrency(code);
  const value = amountRSD / currency.rate;
  const rounded = Number(Math.abs(value).toFixed(currency.decimals));
  const number = rounded.toLocaleString(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  let sign = "";
  if (rounded !== 0) sign = value < 0 ? "-" : showPlus ? "+" : "";

  return currency.symbolFirst
    ? `${sign}${currency.symbol}${number}`
    : `${sign}${number} ${currency.symbol}`;
}

/** Short version for chart labels, e.g. "1.2M RSD" */
export function formatCompactMoney(amountRSD: number, code: CurrencyCode): string {
  const currency = getCurrency(code);
  const compact = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amountRSD / currency.rate);
  return currency.symbolFirst
    ? `${currency.symbol}${compact}`
    : `${compact} ${currency.symbol}`;
}

/** Number typed in the selected currency → RSD for storage */
export function toRSD(displayAmount: string | number, code: CurrencyCode): number {
  return Number(displayAmount) * getCurrency(code).rate;
}

/** RSD → number in the selected currency (for pre-filling form inputs) */
export function toDisplayNumber(amountRSD: number, code: CurrencyCode): number {
  const currency = getCurrency(code);
  return Number((amountRSD / currency.rate).toFixed(currency.decimals));
}

/** Budget with a sign: income is positive, everything else negative */
export function expectedAmount(category: Category): number {
  return category.direction === "in" ? category.budget : -category.budget;
}

/** "Spending" = not income, not tax, not savings */
export function isSpendingCategory(category: Category | undefined): boolean {
  return (
    Boolean(category) &&
    category!.group !== "Income" &&
    category!.kind !== "savings"
  );
}

/** Adds up transaction amounts per category name */
export function totalsByCategory(transactions: Transaction[]): Record<string, number> {
  const totals: Record<string, number> = {};
  transactions.forEach((transaction) => {
    totals[transaction.category] =
      (totals[transaction.category] || 0) + transaction.amount;
  });
  return totals;
}
