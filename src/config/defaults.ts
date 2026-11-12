/* =========================================================
   DEFAULT DATA & CONFIGURATION
   ---------------------------------------------------------
   Everything you might want to tweak lives in this one file:
   storage names, currencies, categories, the example budget,
   chart colours and the sparkle cursor.
   ========================================================= */

import type {
  BalanceItem,
  Category,
  CurrencyCode,
  Currency,
  GroupName,
} from "../types";

// Names under which data is saved in the browser (localStorage).
// The example and the new user are saved separately, so they never mix.
export const STORAGE_KEYS = {
  example: "starryBudget.example", // the demo budget
  user: "starryBudget.user", // the real "new user" budget
  activeProfile: "starryBudget.active", // which one is open ('example' / 'user'); empty = welcome page
  theme: "starryBudget.theme", // light / dark, shared by everything
} as const;


export const OLDEST_BIRTH_YEAR = 1901; // first year in the birth-year wheel

// Every amount is STORED in RSD and only converted when shown.
// "rate" = how many RSD one unit of that currency is worth.
// These rates are approximate – change them any time.
export const CURRENCIES: Record<CurrencyCode, Currency> = {
  RSD: {
    symbol: "RSD",
    rate: 1,
    decimals: 0,
    locale: "de-DE",
    symbolFirst: false,
  },
  EUR: {
    symbol: "€",
    rate: 117.2,
    decimals: 2,
    locale: "de-DE",
    symbolFirst: false,
  },
  USD: {
    symbol: "$",
    rate: 101,
    decimals: 2,
    locale: "en-US",
    symbolFirst: true,
  },
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Order in which groups appear on the Monthly Overview
export const GROUPS: GroupName[] = ["Income", "Housing", "Necessities", "Wants", "Savings"];


// direction: 'in' adds money, 'out' takes money away
// kind:      used by charts → income | tax | need | want | savings
// budget:    expected amount per month, in RSD (always positive)
export const DEFAULT_CATEGORIES: Category[] = [
  {
    name: "Gross Income",
    group: "Income",
    icon: "💰",
    direction: "in",
    kind: "income",
    budget: 270000,
  },
  {
    name: "Taxes",
    group: "Income",
    icon: "🧾",
    direction: "out",
    kind: "tax",
    budget: 43750,
  },
  {
    name: "Bonus",
    group: "Income",
    icon: "🎁",
    direction: "in",
    kind: "income",
    budget: 30000,
  },

  {
    name: "Rent",
    group: "Housing",
    icon: "🏠",
    direction: "out",
    kind: "need",
    budget: 45000,
  },
  {
    name: "Internet Bill",
    group: "Housing",
    icon: "🌐",
    direction: "out",
    kind: "need",
    budget: 4000,
  },
  {
    name: "Electricity Bill",
    group: "Housing",
    icon: "💡",
    direction: "out",
    kind: "need",
    budget: 6000,
  },
  {
    name: "Water Bill",
    group: "Housing",
    icon: "💧",
    direction: "out",
    kind: "need",
    budget: 5000,
  },
  {
    name: "Home Essentials",
    group: "Housing",
    icon: "🧺",
    direction: "out",
    kind: "need",
    budget: 7000,
  },

  {
    name: "Phone Bill",
    group: "Necessities",
    icon: "📱",
    direction: "out",
    kind: "need",
    budget: 4500,
  },
  {
    name: "Groceries",
    group: "Necessities",
    icon: "🛒",
    direction: "out",
    kind: "need",
    budget: 35000,
  },
  {
    name: "Personal Care",
    group: "Necessities",
    icon: "🧴",
    direction: "out",
    kind: "need",
    budget: 7000,
  },
  {
    name: "Transport",
    group: "Necessities",
    icon: "🚌",
    direction: "out",
    kind: "need",
    budget: 8000,
  },
  {
    name: "Healthcare",
    group: "Necessities",
    icon: "🩺",
    direction: "out",
    kind: "need",
    budget: 4000,
  },

  {
    name: "Dining Out",
    group: "Wants",
    icon: "🍜",
    direction: "out",
    kind: "want",
    budget: 6000,
  },
  {
    name: "Entertainment",
    group: "Wants",
    icon: "🎬",
    direction: "out",
    kind: "want",
    budget: 3000,
  },
  {
    name: "Shopping",
    group: "Wants",
    icon: "🛍️",
    direction: "out",
    kind: "want",
    budget: 15000,
  },
  {
    name: "Subscriptions",
    group: "Wants",
    icon: "📺",
    direction: "out",
    kind: "want",
    budget: 3500,
  },
  {
    name: "Travel",
    group: "Wants",
    icon: "✈️",
    direction: "out",
    kind: "want",
    budget: 12000,
  },

  {
    name: "Emergency Fund",
    group: "Savings",
    icon: "🐷",
    direction: "out",
    kind: "savings",
    budget: 40000,
  },
  {
    name: "Vacation Fund",
    group: "Savings",
    icon: "🏝️",
    direction: "out",
    kind: "savings",
    budget: 30000,
  },
];

// Example transactions shown the first time the app opens.
// [day of month, category, amount in RSD, description]
export const EXAMPLE_TRANSACTIONS: [number, string, number, string][] = [
  [1, "Gross Income", 260000, "Monthly salary"],
  [1, "Taxes", 43750, "Income tax & contributions"],
  [1, "Rent", 45000, "Rent payment"],
  [3, "Groceries", 6200, "Weekly grocery shop"],
  [5, "Internet Bill", 2500, "Home internet"],
  [6, "Dining Out", 2400, "Pizza night"],
  [8, "Phone Bill", 2000, "Phone plan"],
  [10, "Groceries", 5400, "Farmers market"],
  [12, "Electricity Bill", 5800, "Electricity"],
  [14, "Emergency Fund", 10000, "Transfer to emergency fund"],
  [15, "Entertainment", 1800, "Cinema tickets"],
  [17, "Groceries", 7100, "Big grocery shop"],
  [18, "Healthcare", 1500, "Pharmacy"],
  [19, "Shopping", 4500, "Cozy sweater"],
  [20, "Water Bill", 1900, "Water"],
  [22, "Subscriptions", 1200, "Streaming service"],
  [24, "Groceries", 4800, "Weekly grocery shop"],
  [25, "Vacation Fund", 5000, "Saving for summer trip"],
  [26, "Personal Care", 2300, "Skincare"],
  [28, "Transport", 3000, "Monthly bus pass"],
];

// Spending in the 3 example months is multiplied by these numbers
// (this month, last month, the month before) so each month looks a bit different
export const EXAMPLE_SPENDING_VARIATION = [1, 0.94, 1.07];

// The example budget's user name, accounts and assets (amounts in RSD).
// Ids are added automatically when the example is created.
export const EXAMPLE_USER_NAME = "Nevena";

export const EXAMPLE_ACCOUNTS: Omit<BalanceItem, "id">[] = [
  { name: "Checking Account", amount: 85000 },
  { name: "Savings", amount: 250000 },
  { name: "Emergency Fund", amount: 120000 },
];

// Example asset, so "Assets On" visibly changes the net worth
export const EXAMPLE_ASSETS: Omit<BalanceItem, "id">[] = [
  { name: "Car", amount: 1200000 },
];

// Colours of the "Top 8 Categories" donut slices (in order)
export const CHART_COLORS = [
  "#f4a6c8",
  "#8d9be6",
  "#b79ef0",
  "#f7c58b",
  "#8fd3c1",
  "#f28fa8",
  "#a3c4f3",
  "#d7a6e8",
];

// Magic sparkle cursor trail
export const SPARKLE_COLORS = ["#ffffff"];
export const MAX_SPARKLES = 60; // never more than this many on screen at once
export const SPARKLE_GAP_MS = 25; // at most one new star every 25 milliseconds
