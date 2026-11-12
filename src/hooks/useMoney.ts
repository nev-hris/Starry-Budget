/* Money formatting that already knows the selected currency.
     const { money } = useMoney();
     money(-1800)  →  "-1.800 RSD"  (or "-€15,36" style in EUR) */

import { useOpenBudget } from "../state/BudgetContext";
import {
  formatCompactMoney,
  formatMoney,
  toDisplayNumber,
  toRSD,
} from "../lib/money";

export function useMoney() {
  const { budget } = useOpenBudget();
  const code = budget.settings.currency;

  return {
    currencyCode: code,
    money: (amountRSD: number, options?: { showPlus?: boolean }) =>
      formatMoney(amountRSD, code, options),
    compactMoney: (amountRSD: number) => formatCompactMoney(amountRSD, code),
    toRSD: (displayAmount: string | number) => toRSD(displayAmount, code),
    toDisplayNumber: (amountRSD: number) => toDisplayNumber(amountRSD, code),
  };
}
