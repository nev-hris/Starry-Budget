/* Creating a new budget: the example one, or an empty one */

import {
  DEFAULT_CATEGORIES,
  EXAMPLE_ACCOUNTS,
  EXAMPLE_ASSETS,
  EXAMPLE_SPENDING_VARIATION,
  EXAMPLE_TRANSACTIONS,
  EXAMPLE_USER_NAME,
} from "../config/defaults";
import type { Budget, Profile, Settings, Transaction } from "../types";
import { createId, daysInMonth, toISODate, today } from "./dates";

/** Builds example transactions for this month and the two before it */
function createExampleTransactions(): Transaction[] {
  const transactions: Transaction[] = [];

  EXAMPLE_SPENDING_VARIATION.forEach((variation, monthsAgo) => {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
    const year = firstOfMonth.getFullYear();
    const monthIndex = firstOfMonth.getMonth();
    const lastDay = daysInMonth(year, monthIndex);

    EXAMPLE_TRANSACTIONS.forEach(([day, categoryName, amount, description]) => {
      const category = DEFAULT_CATEGORIES.find((item) => item.name === categoryName)!;
      // Income stays the same each month; spending is rounded to the nearest 10
      const adjusted =
        category.group === "Income"
          ? amount
          : Math.round((amount * variation) / 10) * 10;

      transactions.push({
        id: createId(),
        date: toISODate(new Date(year, monthIndex, Math.min(day, lastDay))),
        description,
        category: categoryName,
        amount: category.direction === "in" ? adjusted : -adjusted, // stored with a sign
      });
    });
  });

  return transactions;
}

/** Settings every budget starts with */
function createSettings(userName: string): Settings {
  return {
    currency: "RSD",
    userName,
    birthYear: null,
    showAssets: false,
    showIllustrations: true, // the floating page pictures (changed via "Customize")
  };
}

/** A brand-new user: no name, no accounts, no transactions, every budget at 0.
    The categories stay (with 0 budgets) so there is something to pick when adding a transaction. */
function createEmptyBudget(): Budget {
  return {
    settings: createSettings(""),
    accounts: [],
    assets: [],
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category, budget: 0 })),
    transactions: [],
    incomeHistory: [],
  };
}

/** The example budget, filled with sample data (change it in config/defaults.ts) */
function createExampleBudget(): Budget {
  return {
    settings: createSettings(EXAMPLE_USER_NAME),
    accounts: EXAMPLE_ACCOUNTS.map((account) => ({ id: createId(), ...account })),
    assets: EXAMPLE_ASSETS.map((asset) => ({ id: createId(), ...asset })),
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    transactions: createExampleTransactions(),
    incomeHistory: [],
  };
}

export function createFreshBudget(profile: Profile): Budget {
  return profile === "example" ? createExampleBudget() : createEmptyBudget();
}
