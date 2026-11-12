/* =========================================================
   TYPES — what the app's data looks like.
   This is exactly the format saved in localStorage, so it must
   stay the same for old saved budgets to keep loading.
   ========================================================= */

export type CurrencyCode = "RSD" | "EUR" | "USD";

/** 'example' = the demo budget, 'user' = the real "new user" budget */
export type Profile = "example" | "user";

export type Theme = "light" | "dark";

export type PageName = "home" | "transactions" | "monthly" | "yearly" | "income";

export type GroupName = "Income" | "Housing" | "Necessities" | "Wants" | "Savings";

export interface Category {
  name: string;
  group: GroupName;
  icon: string;
  direction: "in" | "out"; // 'in' adds money, 'out' takes money away
  kind: "income" | "tax" | "need" | "want" | "savings"; // used by charts
  budget: number; // expected per month, in RSD (always positive)
}

export interface Transaction {
  id: string;
  date: string; // "YYYY-MM-DD"
  description: string;
  category: string; // the category's name
  amount: number; // in RSD, with a sign: + money in, - money out
}

/** Used for both accounts and assets */
export interface BalanceItem {
  id: string;
  name: string;
  amount: number; // in RSD
}

export interface IncomeEntry {
  id: string;
  year: number;
  hourlyWage: number | null; // in RSD
  salary: number | null; // in RSD
}

export interface Settings {
  currency: CurrencyCode;
  userName: string;
  birthYear: number | null;
  showAssets: boolean;
  showIllustrations: boolean;
}

/** One whole budget (everything saved for a profile) */
export interface Budget {
  settings: Settings;
  accounts: BalanceItem[];
  assets: BalanceItem[];
  categories: Category[];
  transactions: Transaction[];
  incomeHistory: IncomeEntry[];
}

export interface Currency {
  symbol: string;
  rate: number; // how many RSD one unit is worth
  decimals: number;
  locale: string;
  symbolFirst: boolean;
}
