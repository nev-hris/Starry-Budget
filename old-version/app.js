"use strict";

/* =========================================================
   Starry Budget — app.js
   1. Configuration & default data
   2. Date + small helpers
   3. State (load / save in the browser's localStorage)
   4. Money & category helpers
   5. Page switching (router) + theme
   5b. Welcome page (example / new user)
   6. Reusable pop-up form
   7. Forms for each kind of item
   8. Page: Home
   9. Page: All Transactions
   10. Page: Monthly Overview
   11. Page: Yearly Overview
   12. Page: Income History
   13. Chart helpers
   14. Magic sparkle cursor trail
   15. Event listeners & startup
   ========================================================= */

/* ---------- 1. CONFIGURATION & DEFAULT DATA ---------- */

// Names under which data is saved in the browser (localStorage).
// The example and the new user are saved separately, so they never mix.
const STORAGE_KEYS = {
  example: "starryBudget.example", // the demo budget
  user: "starryBudget.user", // the real "new user" budget
  activeProfile: "starryBudget.active", // which one is open ('example' / 'user'); empty = welcome page
  theme: "starryBudget.theme", // light / dark, shared by everything
};

const OLDEST_BIRTH_YEAR = 1901; // first year in the birth-year wheel

// Every amount is STORED in RSD and only converted when shown.
// "rate" = how many RSD one unit of that currency is worth.
// These rates are approximate – change them any time.
const CURRENCIES = {
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

const MONTH_NAMES = [
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
const GROUPS = ["Income", "Housing", "Necessities", "Wants", "Savings"];

// direction: 'in' adds money, 'out' takes money away
// kind:      used by charts → income | tax | need | want | savings
// budget:    expected amount per month, in RSD (always positive)
const DEFAULT_CATEGORIES = [
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
const EXAMPLE_TRANSACTIONS = [
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

const CHART_COLORS = [
  "#f4a6c8",
  "#8d9be6",
  "#b79ef0",
  "#f7c58b",
  "#8fd3c1",
  "#f28fa8",
  "#a3c4f3",
  "#d7a6e8",
];

/* ---------- 2. DATE + SMALL HELPERS ---------- */

const today = new Date();
const todayISO = toISODate(today);

/** Date object → "YYYY-MM-DD" (using local time, not UTC) */
function toISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-11-15" → "2026-11" */
function monthKey(isoDate) {
  return isoDate.slice(0, 7);
}

function daysInMonth(year, monthIndex) {
  // Day 0 of next month = last day of this month
  return new Date(year, monthIndex + 1, 0).getDate();
}

function isFuture(isoDate) {
  // ISO dates compare correctly as plain text
  return isoDate > todayISO;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sumBy(list, getValue) {
  return list.reduce((total, item) => total + getValue(item), 0);
}

let idCounter = 0;
function createId() {
  idCounter += 1;
  return `${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Stops user text from being treated as HTML */
function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value).replace(/[&<>"']/g, (char) => replacements[char]);
}

const $ = (selector) => document.querySelector(selector);

/* ---------- 3. STATE ---------- */

let state; // the open budget's data (see createExampleState)
let activeProfile = null; // 'example', 'user', or null (welcome page)
let currentTheme = "light"; // 'light' or 'dark'
let currentPage = "home";
let selectedMonth = monthKey(todayISO); // Monthly Overview
let selectedYear = today.getFullYear(); // Yearly Overview
let showFutureTransactions = true; // All Transactions filter

/** Builds example transactions for this month and the two before it */
function createExampleTransactions() {
  const spendingVariation = [1, 0.94, 1.07]; // makes each month look slightly different
  const transactions = [];

  spendingVariation.forEach((variation, monthsAgo) => {
    const year = new Date(
      today.getFullYear(),
      today.getMonth() - monthsAgo,
      1,
    ).getFullYear();
    const monthIndex = new Date(
      today.getFullYear(),
      today.getMonth() - monthsAgo,
      1,
    ).getMonth();
    const lastDay = daysInMonth(year, monthIndex);

    EXAMPLE_TRANSACTIONS.forEach(([day, categoryName, amount, description]) => {
      const category = DEFAULT_CATEGORIES.find(
        (item) => item.name === categoryName,
      );
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
function createSettings(userName) {
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
function createEmptyState() {
  return {
    settings: createSettings(""),
    accounts: [],
    assets: [],
    categories: DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      budget: 0,
    })),
    transactions: [],
    incomeHistory: [],
  };
}

/** The example budget, filled with sample data.
    Change the example's name, accounts and assets here. */
function createExampleState() {
  return {
    settings: createSettings("Nevena"),
    accounts: [
      { id: createId(), name: "Checking Account", amount: 85000 },
      { id: createId(), name: "Savings", amount: 250000 },
      { id: createId(), name: "Emergency Fund", amount: 120000 },
    ],
    // Example asset, so "Assets On" visibly changes the net worth
    assets: [{ id: createId(), name: "Car", amount: 1200000 }],
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    transactions: createExampleTransactions(),
    incomeHistory: [],
  };
}

function createFreshState(profile) {
  return profile === "example" ? createExampleState() : createEmptyState();
}

/* Small safe wrappers: storage can be blocked (e.g. private windows),
   so every read/write is wrapped in try/catch and the app still works. */
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Could not save data.", error);
  }
}

/** Loads the saved budget for a profile, or a fresh one if nothing is saved */
function loadState(profile) {
  try {
    const saved = JSON.parse(readStorage(STORAGE_KEYS[profile]));
    if (saved && Array.isArray(saved.transactions)) {
      const defaults = createFreshState(profile);
      // Merge so newly added settings still get a default value
      return {
        ...defaults,
        ...saved,
        settings: { ...defaults.settings, ...saved.settings },
      };
    }
  } catch (error) {
    console.warn("Saved data could not be read, starting fresh.", error);
  }
  return createFreshState(profile);
}

function saveState() {
  if (!activeProfile) return;
  writeStorage(STORAGE_KEYS[activeProfile], JSON.stringify(state));
}

/* ---------- 4. MONEY & CATEGORY HELPERS ---------- */

function getCurrency() {
  return CURRENCIES[state.settings.currency] || CURRENCIES.RSD;
}

/** RSD amount → text in the selected currency, e.g. "-1.800 RSD" or "$17.82" */
function formatMoney(amountRSD, { showPlus = false } = {}) {
  const currency = getCurrency();
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
function formatCompactMoney(amountRSD) {
  const currency = getCurrency();
  const compact = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amountRSD / currency.rate);
  return currency.symbolFirst
    ? `${currency.symbol}${compact}`
    : `${compact} ${currency.symbol}`;
}

/** Number typed in the selected currency → RSD for storage */
function toRSD(displayAmount) {
  return Number(displayAmount) * getCurrency().rate;
}

/** RSD → number in the selected currency (for pre-filling form inputs) */
function toDisplayNumber(amountRSD) {
  const currency = getCurrency();
  return Number((amountRSD / currency.rate).toFixed(currency.decimals));
}

function getCategory(name) {
  return state.categories.find((category) => category.name === name);
}

/** Budget with a sign: income is positive, everything else negative */
function expectedAmount(category) {
  return category.direction === "in" ? category.budget : -category.budget;
}

/** "Spending" = not income, not tax, not savings */
function isSpendingCategory(category) {
  return (
    Boolean(category) &&
    category.group !== "Income" &&
    category.kind !== "savings"
  );
}

/** Adds up transaction amounts per category name */
function totalsByCategory(transactions) {
  const totals = {};
  transactions.forEach((transaction) => {
    totals[transaction.category] =
      (totals[transaction.category] || 0) + transaction.amount;
  });
  return totals;
}

function categoryOptions() {
  return state.categories.map((category) => ({
    value: category.name,
    label: `${category.icon} ${category.name}`,
    group: category.group,
  }));
}

/* ---------- 5. PAGE SWITCHING + THEME ---------- */

const PAGE_RENDERERS = {
  home: renderHome,
  transactions: renderTransactions,
  monthly: renderMonthly,
  yearly: renderYearly,
  income: renderIncome,
};

function showPage(pageName) {
  currentPage = PAGE_RENDERERS[pageName] ? pageName : "home";

  document.querySelectorAll(".page").forEach((page) => {
    page.hidden = page.id !== `page-${currentPage}`;
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === currentPage);
  });

  renderCurrentPage();
  window.scrollTo({ top: 0 });
}

function renderCurrentPage() {
  PAGE_RENDERERS[currentPage]();
  // The "hide-illustrations" class on <body> hides every page picture (see styles.css)
  document.body.classList.toggle(
    "hide-illustrations",
    !state.settings.showIllustrations,
  );
}

function renderHeader() {
  // A new user without a name is greeted with "Hi there!"
  $("#userNameLabel").textContent = state.settings.userName || "there";
  $("#currencySelect").value = state.settings.currency;
  $("#modeBadge").hidden = activeProfile !== "example";
}

function renderAll() {
  renderHeader();
  applyTheme();
  renderCurrentPage();
}

function applyTheme() {
  const theme = currentTheme;
  // Setting data-theme on <html> swaps the colours AND triggers the
  // icon "morph" in the theme button (see .theme-icon in styles.css)
  document.documentElement.dataset.theme = theme;

  // The hover label names the mode shown on the icon
  const label = theme === "dark" ? "Dark Mode" : "Light Mode";
  $("#themeSwitcher").dataset.label = label;
  $("#themeToggle").setAttribute("aria-label", `${label} (click to switch)`);
}

/* ---------- 5b. WELCOME PAGE ----------
   The welcome page shows when no budget is open. Its two buttons call
   enterProfile('example') or enterProfile('user'). */

function showWelcome() {
  activeProfile = null;
  writeStorage(STORAGE_KEYS.activeProfile, null);

  // If the new user already saved a budget, offer to continue it
  const savedUser = readStorage(STORAGE_KEYS.user) ? loadState("user") : null;
  if (savedUser) {
    const name = savedUser.settings.userName;
    $("#newUserTitle").textContent = name
      ? `Continue as ${name}`
      : "Continue your budget";
    $("#newUserText").textContent = "Pick up right where you left off.";
  } else {
    $("#newUserTitle").textContent = "Start as a new user";
    $("#newUserText").textContent =
      "A completely empty budget, ready for your own accounts and transactions.";
  }

  $("#topbar").hidden = true;
  $("#appMain").hidden = true;
  $("#welcomeScreen").hidden = false;
  window.scrollTo({ top: 0 });
}

/** Opens a budget. The example always starts fresh, so it looks the same every visit. */
function enterProfile(profile) {
  activeProfile = profile;
  writeStorage(STORAGE_KEYS.activeProfile, profile);
  state = profile === "example" ? createExampleState() : loadState("user");
  saveState();
  showApp("home");
}

/** Hides the welcome page and shows the budget pages */
function showApp(pageName) {
  $("#welcomeScreen").hidden = true;
  $("#topbar").hidden = false;
  $("#appMain").hidden = false;
  populateCategoryFilter();
  renderHeader();
  showPage(pageName);
}

/* ---------- 6. REUSABLE POP-UP FORM ----------
   openFormModal({ title, fields, onSubmit, onDelete, extraButton })
   - fields:      [{ name, label, type, value, options, help, placeholder, min, step }]
                  type can also be 'yearWheel' (scrollable birth-year picker)
   - onSubmit:    receives the values; return an error message to keep the form open
   - onDelete:    optional; shows the Delete button
   - extraButton: optional { label, onClick }; an extra button on the left */

let activeDialog = null;

function openFormModal({
  title,
  fields,
  submitLabel = "Save",
  onSubmit,
  onDelete = null,
  extraButton = null,
}) {
  activeDialog = { fields, onSubmit, onDelete, extraButton };

  $("#dialogTitle").textContent = title;
  $("#dialogFields").innerHTML = fields.map(renderField).join("");
  $("#dialogSubmitButton").textContent = submitLabel;
  $("#dialogDeleteButton").hidden = !onDelete;
  $("#dialogExtraButton").hidden = !extraButton;
  $("#dialogExtraButton").textContent = extraButton?.label ?? "";
  $("#dialogError").textContent = "";

  $("#formDialog").showModal();

  // Connect any year wheel to its text box
  $("#dialogFields").querySelectorAll(".wheel-list").forEach(setupYearWheel);

  const firstInput = $("#dialogFields").querySelector(
    'input:not([type="hidden"]), select',
  );
  if (firstInput) firstInput.focus();
}

/* ----- Year field: type the year, or (optionally) use the wheel -----
   The text box is the real form field. The "Use the wheel" button shows a
   scrollable list of years; whatever the wheel lands on is written into
   the text box, and typing a full year moves the wheel to match. */

const WHEEL_ITEM_HEIGHT = 40; // must match .wheel-item height in styles.css

function renderYearWheel(field) {
  const currentYear = today.getFullYear();
  const inputId = `field-${field.name}`;

  let items = '<li class="wheel-item" data-value="">Not set</li>';
  for (let year = currentYear; year >= OLDEST_BIRTH_YEAR; year -= 1) {
    items += `<li class="wheel-item" data-value="${year}">${year} <small>age ${currentYear - year}</small></li>`;
  }

  return `
    <div class="form-field">
      <label for="${inputId}">${escapeHtml(field.label)}</label>
      <div class="year-entry">
        <input class="input year-typed" type="text" inputmode="numeric" maxlength="4" autocomplete="off"
          id="${inputId}" name="${field.name}" value="${escapeHtml(field.value ?? "")}" placeholder="e.g. 1995" />
        <button type="button" class="btn year-wheel-toggle" aria-expanded="false">Use the wheel</button>
      </div>
      <div class="year-wheel" hidden>
        <ul class="wheel-list" tabindex="0" aria-label="${escapeHtml(field.label)}" data-input="${inputId}">${items}</ul>
      </div>
      <small>Type a year from ${OLDEST_BIRTH_YEAR} to ${currentYear}, or leave it empty.</small>
    </div>`;
}

/** Is this text a full year the wheel offers? */
function isValidBirthYear(text) {
  const year = Number(text);
  return (
    /^\d{4}$/.test(text) &&
    year >= OLDEST_BIRTH_YEAR &&
    year <= today.getFullYear()
  );
}

function setupYearWheel(list) {
  const input = document.getElementById(list.dataset.input);
  const wheel = list.parentElement;
  const toggleButton = wheel.parentElement.querySelector(".year-wheel-toggle");
  const items = [...list.querySelectorAll(".wheel-item")];

  // Marks one item as chosen and writes its value into the text box
  const selectIndex = (index) => {
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    items.forEach((item, i) =>
      item.classList.toggle("is-selected", i === safeIndex),
    );
    input.value = items[safeIndex].dataset.value;
    return safeIndex;
  };
  const scrollToIndex = (index, behavior = "smooth") => {
    list.scrollTo({ top: selectIndex(index) * WHEEL_ITEM_HEIGHT, behavior });
  };
  const indexOfYear = (text) =>
    Math.max(
      0,
      items.findIndex((item) => item.dataset.value === text),
    );

  // "Use the wheel" / "Hide the wheel"
  toggleButton.addEventListener("click", () => {
    wheel.hidden = !wheel.hidden;
    toggleButton.textContent = wheel.hidden
      ? "Use the wheel"
      : "Hide the wheel";
    toggleButton.setAttribute("aria-expanded", String(!wheel.hidden));
    // The wheel can only scroll once it's visible; jump to the typed year (or "Not set")
    if (!wheel.hidden) scrollToIndex(indexOfYear(input.value), "auto");
  });

  // Typing: only digits allowed (so no minus sign); a full valid year moves the wheel
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
    if (wheel.hidden) return;
    if (input.value === "" || isValidBirthYear(input.value)) {
      const typed = input.value;
      list.scrollTo({
        top: indexOfYear(typed) * WHEEL_ITEM_HEIGHT,
        behavior: "auto",
      });
      items.forEach((item) =>
        item.classList.toggle("is-selected", item.dataset.value === typed),
      );
    }
  });

  // Scrolling: whichever item is in the middle band becomes the chosen one.
  // (Skipped while the person is typing, so the wheel never overwrites their text.)
  list.addEventListener("scroll", () => {
    if (document.activeElement === input) return;
    selectIndex(Math.round(list.scrollTop / WHEEL_ITEM_HEIGHT));
  });
  // Touching or mouse-wheeling the wheel means "I'm using the wheel now"
  ["pointerdown", "wheel"].forEach((eventName) => {
    list.addEventListener(eventName, () => input.blur(), { passive: true });
  });
  list.addEventListener("click", (event) => {
    const item = event.target.closest(".wheel-item");
    if (item) scrollToIndex(items.indexOf(item));
  });
  list.addEventListener("keydown", (event) => {
    const current = items.findIndex((item) =>
      item.classList.contains("is-selected"),
    );
    if (event.key === "ArrowDown") scrollToIndex(current + 1);
    else if (event.key === "ArrowUp") scrollToIndex(current - 1);
    else return;
    event.preventDefault();
  });
}

function closeDialog() {
  $("#formDialog").close();
  activeDialog = null;
}

function renderField(field) {
  const id = `field-${field.name}`;
  const value = field.value ?? "";

  if (field.type === "yearWheel") return renderYearWheel(field);

  if (field.type === "checkbox") {
    return `
      <label class="checkbox-field" for="${id}">
        <input type="checkbox" id="${id}" name="${field.name}" ${field.value ? "checked" : ""} />
        <span>${escapeHtml(field.label)}</span>
      </label>`;
  }

  let control;
  if (field.type === "select") {
    control = `<select class="input" id="${id}" name="${field.name}">${renderOptions(field.options, value)}</select>`;
  } else {
    const numberAttributes =
      field.type === "number"
        ? `step="${field.step ?? "any"}" min="${field.min ?? ""}" inputmode="decimal"`
        : "";
    control = `<input class="input" type="${field.type || "text"}" id="${id}" name="${field.name}"
      value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || "")}" ${numberAttributes} />`;
  }

  return `
    <label class="form-field" for="${id}">
      <span>${escapeHtml(field.label)}</span>
      ${control}
      ${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}
    </label>`;
}

/** Options with a "group" property are wrapped in <optgroup> */
function renderOptions(options, selectedValue) {
  let html = "";
  let currentGroup = null;

  options.forEach((option) => {
    if (option.group && option.group !== currentGroup) {
      if (currentGroup) html += "</optgroup>";
      html += `<optgroup label="${escapeHtml(option.group)}">`;
      currentGroup = option.group;
    }
    const selected =
      String(option.value) === String(selectedValue) ? "selected" : "";
    html += `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
  });

  if (currentGroup) html += "</optgroup>";
  return html;
}

function handleDialogSubmit(event) {
  event.preventDefault();
  if (!activeDialog) return;

  const form = $("#dialogForm");
  const values = {};
  activeDialog.fields.forEach((field) => {
    const input = form.elements[field.name];
    values[field.name] =
      field.type === "checkbox" ? input.checked : input.value.trim();
  });

  const errorMessage = activeDialog.onSubmit(values);
  if (errorMessage) {
    $("#dialogError").textContent = errorMessage;
    return;
  }

  closeDialog();
  saveState();
  renderAll();
}

function handleDialogDelete() {
  if (!activeDialog?.onDelete) return;
  if (!window.confirm("Delete this item? This cannot be undone.")) return;

  activeDialog.onDelete();
  closeDialog();
  saveState();
  renderAll();
}

/* ---------- 7. FORMS FOR EACH KIND OF ITEM ---------- */

/** Accounts and assets work the same way: a name and an amount */
function openBalanceItemModal(listName, item = null) {
  const isEditing = Boolean(item);
  const singular = listName === "accounts" ? "Account" : "Asset";
  const currencyCode = state.settings.currency;

  openFormModal({
    title: `${isEditing ? "Edit" : "Add"} ${singular}`,
    fields: [
      {
        name: "name",
        label: `${singular} name`,
        value: item?.name,
        placeholder:
          listName === "accounts" ? "e.g. Checking Account" : "e.g. Car",
      },
      {
        name: "amount",
        label: `${listName === "accounts" ? "Balance" : "Value"} (${currencyCode})`,
        type: "number",
        value: item ? toDisplayNumber(item.amount) : "",
      },
    ],
    onSubmit: ({ name, amount }) => {
      if (!name) return "Please enter a name.";
      if (amount === "" || Number.isNaN(Number(amount)))
        return "Please enter a valid amount.";

      if (isEditing) {
        Object.assign(item, { name, amount: toRSD(amount) });
      } else {
        state[listName].push({ id: createId(), name, amount: toRSD(amount) });
      }
      return null;
    },
    onDelete: isEditing
      ? () => {
          state[listName] = state[listName].filter(
            (entry) => entry.id !== item.id,
          );
        }
      : null,
  });
}

function openTransactionModal(transaction = null) {
  const isEditing = Boolean(transaction);

  openFormModal({
    title: isEditing ? "Edit Transaction" : "New Transaction",
    fields: [
      {
        name: "date",
        label: "Date",
        type: "date",
        value: transaction?.date ?? todayISO,
      },
      {
        name: "description",
        label: "Description",
        value: transaction?.description,
        placeholder: "e.g. Weekly groceries",
      },
      {
        name: "category",
        label: "Category",
        type: "select",
        value: transaction?.category ?? "Groceries",
        options: categoryOptions(),
      },
      {
        name: "amount",
        label: `Amount (${state.settings.currency})`,
        type: "number",
        min: 0,
        value: isEditing ? toDisplayNumber(Math.abs(transaction.amount)) : "",
        help: "Enter a positive number. Income categories add money, all others subtract it.",
      },
    ],
    onSubmit: ({ date, description, category, amount }) => {
      const number = Number(amount);
      if (!date) return "Please choose a date.";
      if (!description) return "Please add a description.";
      if (!(number > 0)) return "Amount must be greater than 0.";

      // The category decides if the amount is money in (+) or out (-)
      const amountRSD = toRSD(number);
      const signedAmount =
        getCategory(category).direction === "in" ? amountRSD : -amountRSD;

      if (isEditing) {
        Object.assign(transaction, {
          date,
          description,
          category,
          amount: signedAmount,
        });
      } else {
        state.transactions.push({
          id: createId(),
          date,
          description,
          category,
          amount: signedAmount,
        });
      }
      return null;
    },
    onDelete: isEditing
      ? () => {
          state.transactions = state.transactions.filter(
            (entry) => entry.id !== transaction.id,
          );
        }
      : null,
  });
}

function openBudgetModal(categoryName) {
  const category = getCategory(categoryName);

  openFormModal({
    title: `${category.icon} ${category.name} budget`,
    fields: [
      {
        name: "budget",
        label: `Expected per month (${state.settings.currency})`,
        type: "number",
        min: 0,
        value: toDisplayNumber(category.budget),
      },
    ],
    onSubmit: ({ budget }) => {
      const number = Number(budget);
      if (budget === "" || Number.isNaN(number) || number < 0)
        return "Please enter 0 or more.";
      category.budget = toRSD(number);
      return null;
    },
  });
}

function openIncomeEntryModal(entry = null) {
  const isEditing = Boolean(entry);
  const currencyCode = state.settings.currency;

  openFormModal({
    title: isEditing ? `Edit ${entry.year}` : "Add Income Entry",
    fields: [
      {
        name: "year",
        label: "Year",
        type: "number",
        step: 1,
        value: entry?.year ?? today.getFullYear(),
      },
      {
        name: "hourlyWage",
        label: `Hourly wage (${currencyCode})`,
        type: "number",
        min: 0,
        value: entry?.hourlyWage ? toDisplayNumber(entry.hourlyWage) : "",
        help: "Optional",
      },
      {
        name: "salary",
        label: `Yearly salary (${currencyCode})`,
        type: "number",
        min: 0,
        value: entry?.salary ? toDisplayNumber(entry.salary) : "",
        help: "Optional",
      },
    ],
    onSubmit: ({ year, hourlyWage, salary }) => {
      const yearNumber = Number(year);
      if (
        !Number.isInteger(yearNumber) ||
        yearNumber < 1950 ||
        yearNumber > 2100
      )
        return "Please enter a valid year.";
      if (!hourlyWage && !salary)
        return "Fill in an hourly wage, a salary, or both.";

      // Only one entry per year is allowed
      const duplicate = state.incomeHistory.find(
        (item) => item.year === yearNumber && item !== entry,
      );
      if (duplicate)
        return `There is already an entry for ${yearNumber}. Click it in the table to edit.`;

      const values = {
        year: yearNumber,
        hourlyWage: hourlyWage ? toRSD(hourlyWage) : null,
        salary: salary ? toRSD(salary) : null,
      };

      if (isEditing) Object.assign(entry, values);
      else state.incomeHistory.push({ id: createId(), ...values });
      return null;
    },
    onDelete: isEditing
      ? () => {
          state.incomeHistory = state.incomeHistory.filter(
            (item) => item.id !== entry.id,
          );
        }
      : null,
  });
}

function openUserModal() {
  const isExample = activeProfile === "example";

  openFormModal({
    title: isExample ? "Your User (example)" : "Your User",
    fields: [
      {
        name: "userName",
        label: "Name",
        value: state.settings.userName,
        placeholder: "Your name",
      },
      {
        name: "birthYear",
        label: "Birth year (used to work out your age)",
        type: "yearWheel",
        value: state.settings.birthYear ?? "",
      },
      {
        name: "resetData",
        label: isExample
          ? "Reset the example back to the start"
          : "Erase all my data and start empty",
        type: "checkbox",
        value: false,
      },
    ],
    extraButton: { label: "← Back to welcome page", onClick: showWelcome },
    onSubmit: ({ userName, birthYear, resetData }) => {
      // A typed year must be a real year between 1901 and this year
      if (birthYear && !isValidBirthYear(birthYear)) {
        return `Please enter a birth year from ${OLDEST_BIRTH_YEAR} to ${today.getFullYear()}.`;
      }
      const yearNumber = birthYear ? Number(birthYear) : null;

      if (resetData) {
        const question = isExample
          ? "Restore the example to how it started?"
          : "This deletes everything you entered. Continue?";
        if (!window.confirm(question)) return "Reset cancelled.";

        const { currency } = state.settings;
        state = createFreshState(activeProfile);
        state.settings.currency = currency;
        populateCategoryFilter();
      }

      state.settings.userName = userName;
      state.settings.birthYear = yearNumber;
      return null;
    },
  });
}

/** "Customize" has one option: show or hide the animated illustrations (all pages) */
function openCustomizeModal() {
  openFormModal({
    title: "Customize",
    submitLabel: "Apply",
    fields: [
      {
        name: "showIllustrations",
        label: "Show animated illustrations",
        type: "checkbox",
        value: state.settings.showIllustrations,
      },
    ],
    onSubmit: ({ showIllustrations }) => {
      state.settings.showIllustrations = showIllustrations;
      return null;
    },
  });
}

/* ---------- 8. PAGE: HOME ---------- */

function renderHome() {
  // Net worth = account balances (+ assets when "Assets On")
  const accountsTotal = sumBy(state.accounts, (account) => account.amount);
  const assetsTotal = sumBy(state.assets, (asset) => asset.amount);
  const netWorth =
    accountsTotal + (state.settings.showAssets ? assetsTotal : 0);

  $("#netWorthValue").textContent = formatMoney(netWorth);

  // Small line under the total that explains what it includes
  let note;
  if (!state.assets.length) {
    note = "No assets yet. Add one below to include it.";
  } else if (state.settings.showAssets) {
    note = `Accounts ${formatMoney(accountsTotal)} + Assets ${formatMoney(assetsTotal)}`;
  } else {
    note = `Accounts only (Assets ${formatMoney(assetsTotal)} not included)`;
  }
  $("#netWorthNote").textContent = note;

  document.querySelectorAll("[data-assets]").forEach((button) => {
    button.classList.toggle(
      "active",
      (button.dataset.assets === "on") === state.settings.showAssets,
    );
  });

  $("#accountsList").innerHTML = renderBalanceList(
    state.accounts,
    "👛",
    "No accounts added yet.",
  );
  $("#assetsList").innerHTML = renderBalanceList(
    state.assets,
    "💎",
    "No assets added yet.",
  );

  const recentTransactions = state.transactions
    .filter((transaction) => !isFuture(transaction.date))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  $("#recentTransactionsList").innerHTML = recentTransactions.length
    ? recentTransactions.map(renderTransactionItem).join("")
    : '<li class="empty-on-bg">No recent transactions yet.</li>';
}

function renderBalanceList(items, icon, emptyMessage) {
  if (!items.length) return `<li class="empty-on-bg">${emptyMessage}</li>`;

  return items
    .map(
      (item) => `
    <li>
      <button type="button" class="money-item" data-item-id="${item.id}">
        <span class="item-icon" aria-hidden="true">${icon}</span>
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span>${formatMoney(item.amount)}</span>
      </button>
    </li>`,
    )
    .join("");
}

/** One transaction as a small card (Home + "Cards" view) */
function renderTransactionItem(transaction) {
  const category = getCategory(transaction.category);
  const future = isFuture(transaction.date);
  const amountClass = transaction.amount >= 0 ? "is-positive" : "is-negative";

  return `
    <li>
      <button type="button" class="transaction-item ${future ? "is-future" : ""}" data-transaction-id="${transaction.id}">
        <span class="transaction-icon" aria-hidden="true">${category?.icon ?? "💸"}</span>
        <span class="transaction-main">
          <span class="transaction-title">${escapeHtml(transaction.description)}</span>
          <span class="transaction-meta">${formatDate(transaction.date)} · ${escapeHtml(transaction.category)}${future ? '<span class="badge">Upcoming</span>' : ""}</span>
        </span>
        <span class="amount ${amountClass}">${formatMoney(transaction.amount, { showPlus: true })}</span>
      </button>
    </li>`;
}

/* ---------- 9. PAGE: ALL TRANSACTIONS ---------- */

function populateCategoryFilter() {
  $("#filterCategory").innerHTML =
    '<option value="all">All categories</option>' +
    renderOptions(categoryOptions(), "all");
}

/** Reads every filter input and returns matching transactions, newest first */
function getFilteredTransactions() {
  const searchText = $("#filterSearch").value.trim().toLowerCase();
  const range = $("#filterRange").value;
  const flow = $("#filterFlow").value;
  const categoryName = $("#filterCategory").value;

  const thisMonth = monthKey(todayISO);
  const lastMonth = monthKey(
    toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
  );
  const thisYear = String(today.getFullYear());

  return state.transactions
    .filter((transaction) => {
      if (!showFutureTransactions && isFuture(transaction.date)) return false;
      if (range === "this-month" && monthKey(transaction.date) !== thisMonth)
        return false;
      if (range === "last-month" && monthKey(transaction.date) !== lastMonth)
        return false;
      if (range === "this-year" && !transaction.date.startsWith(thisYear))
        return false;
      if (flow === "in" && transaction.amount < 0) return false;
      if (flow === "out" && transaction.amount > 0) return false;
      if (categoryName !== "all" && transaction.category !== categoryName)
        return false;
      if (searchText) {
        const haystack =
          `${transaction.description} ${transaction.category}`.toLowerCase();
        if (!haystack.includes(searchText)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderTransactions() {
  document.querySelectorAll("[data-future]").forEach((button) => {
    button.classList.toggle(
      "active",
      (button.dataset.future === "show") === showFutureTransactions,
    );
  });

  const transactions = getFilteredTransactions();
  const resultsElement = $("#transactionsResults");

  if (!transactions.length) {
    $("#transactionsSummary").textContent = "";
    resultsElement.innerHTML =
      '<div class="card empty-card">No transactions found.</div>';
    return;
  }

  const moneyIn = sumBy(
    transactions.filter((t) => t.amount > 0),
    (t) => t.amount,
  );
  const moneyOut = sumBy(
    transactions.filter((t) => t.amount < 0),
    (t) => t.amount,
  );
  $("#transactionsSummary").textContent =
    `${transactions.length} transactions · In ${formatMoney(moneyIn)} · Out ${formatMoney(Math.abs(moneyOut))}`;

  resultsElement.innerHTML =
    $("#filterView").value === "cards"
      ? `<ul class="transaction-list cards-grid">${transactions.map(renderTransactionItem).join("")}</ul>`
      : renderTransactionsTable(transactions);
}

function renderTransactionsTable(transactions) {
  const rows = transactions
    .map((transaction) => {
      const category = getCategory(transaction.category);
      const future = isFuture(transaction.date);
      const amountClass =
        transaction.amount >= 0 ? "is-positive" : "is-negative";

      return `
      <tr class="clickable-row ${future ? "is-future" : ""}" data-transaction-id="${transaction.id}" tabindex="0">
        <td>${formatDate(transaction.date)}${future ? '<span class="badge">Upcoming</span>' : ""}</td>
        <td>${escapeHtml(transaction.description)}</td>
        <td><span class="category-chip">${category?.icon ?? ""} ${escapeHtml(transaction.category)}</span></td>
        <td class="align-right amount ${amountClass}">${formatMoney(transaction.amount, { showPlus: true })}</td>
      </tr>`;
    })
    .join("");

  return `
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="align-right">Amount</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function resetTransactionFilters() {
  $("#filterSearch").value = "";
  $("#filterRange").value = "this-month";
  $("#filterFlow").value = "any";
  $("#filterCategory").value = "all";
  showFutureTransactions = true;
  renderTransactions();
}

/* ---------- 10. PAGE: MONTHLY OVERVIEW ---------- */

function renderMonthly() {
  const [year, monthNumber] = selectedMonth.split("-").map(Number);
  const monthIndex = monthNumber - 1;

  $("#monthPicker").value = selectedMonth;
  $("#monthlyTitle").textContent = `${MONTH_NAMES[monthIndex]} ${year}`;

  // "Actual" only counts transactions up to today
  const monthTransactions = state.transactions.filter(
    (transaction) =>
      monthKey(transaction.date) === selectedMonth &&
      !isFuture(transaction.date),
  );
  const actualByCategory = totalsByCategory(monthTransactions);

  renderCategoryBreakdown(actualByCategory);
  renderMoneyInOut(actualByCategory);
  renderWeeklySpending(monthTransactions, year, monthIndex);
  renderTopCategories(actualByCategory);
  renderCategoryGroups(actualByCategory);
  renderCumulativeChart(monthTransactions, year, monthIndex);
}

function renderCategoryBreakdown(actualByCategory) {
  const actualOf = (category) => actualByCategory[category.name] || 0;
  let html =
    '<div class="breakdown-row breakdown-head"><span></span><span>Expected</span><span>Current</span><span></span></div>';

  GROUPS.forEach((group) => {
    const categories = state.categories.filter(
      (category) => category.group === group,
    );
    const groupExpected = sumBy(categories, expectedAmount);
    const groupActual = sumBy(categories, actualOf);

    html += `<div class="group-pill-row"><span class="group-pill" data-group="${group}">${group}</span></div>`;

    if (group !== "Income") {
      html += breakdownRow({
        label: "Total",
        expected: groupExpected,
        actual: groupActual,
        isTotal: true,
      });
    }

    categories.forEach((category) => {
      html += breakdownRow({
        label: category.name,
        icon: category.icon,
        expected: expectedAmount(category),
        actual: actualOf(category),
        categoryName: category.name,
      });
    });

    // Income ends with a calculated "Net Income" line (gross − taxes + bonus)
    if (group === "Income") {
      html += breakdownRow({
        label: "Net Income",
        icon: "💖",
        expected: groupExpected,
        actual: groupActual,
        isTotal: true,
      });
    }
  });

  $("#categoryBreakdown").innerHTML = html;
}

function breakdownRow({
  label,
  icon = "",
  expected,
  actual,
  categoryName = null,
  isTotal = false,
}) {
  const ratio = expected !== 0 ? actual / expected : 0;
  const percent = expected !== 0 ? `${Math.round(ratio * 100)}%` : "";
  const isOverBudget = expected < 0 && ratio > 1;

  // Only real categories get a clickable (editable) expected amount
  const expectedCell = categoryName
    ? `<button type="button" class="budget-button" data-budget-category="${escapeHtml(categoryName)}">${formatMoney(expected)}</button>`
    : `<span>${formatMoney(expected)}</span>`;

  return `
    <div class="breakdown-row ${isTotal ? "is-total" : ""}">
      <span class="breakdown-name">${icon ? `<span class="row-icon" aria-hidden="true">${icon}</span>` : ""}${escapeHtml(label)}</span>
      ${expectedCell}
      <span>${formatMoney(actual)}</span>
      <span class="breakdown-percent ${isOverBudget ? "is-over" : ""}">${percent}</span>
    </div>`;
}

function renderMoneyInOut(actualByCategory) {
  const includeSavings = $("#moneyModeSelect").value === "include";
  const incomeCategories = state.categories.filter(
    (category) => category.group === "Income",
  );
  const outCategories = state.categories.filter(
    (category) =>
      category.group !== "Income" &&
      (includeSavings || category.kind !== "savings"),
  );

  // Money in = net income (taxes already subtracted)
  const expectedIn = sumBy(incomeCategories, expectedAmount);
  const expectedOut = sumBy(outCategories, (category) => category.budget);
  const actualIn = sumBy(
    incomeCategories,
    (category) => actualByCategory[category.name] || 0,
  );
  const actualOut = -sumBy(
    outCategories,
    (category) => actualByCategory[category.name] || 0,
  );

  const tallest = Math.max(expectedIn, expectedOut, actualIn, actualOut, 1);
  const bar = (value, type) => `
    <div class="io-bar">
      <span class="io-value">${formatMoney(value)}</span>
      <div class="io-track"><div class="io-fill ${type}" style="height:${(Math.max(value, 0) / tallest) * 100}%"></div></div>
      <span class="io-label">${type === "in" ? "Money In" : "Money Out"}</span>
    </div>`;
  const ratio = (moneyIn, moneyOut) =>
    moneyIn > 0 ? `${((moneyOut / moneyIn) * 100).toFixed(1)}%` : "N/A";

  $("#moneyInOutChart").innerHTML = `
    <div class="io-chart">
      <div class="io-group">
        <h4>Expected</h4>
        <div class="io-bars">${bar(expectedIn, "in")}${bar(expectedOut, "out")}</div>
        <p class="io-ratio">Out / In: ${ratio(expectedIn, expectedOut)}</p>
      </div>
      <div class="io-group">
        <h4>Actual</h4>
        <div class="io-bars">${bar(actualIn, "in")}${bar(actualOut, "out")}</div>
        <p class="io-ratio">Out / In: ${ratio(actualIn, actualOut)}</p>
      </div>
    </div>`;
}

function renderWeeklySpending(monthTransactions, year, monthIndex) {
  const lastDay = daysInMonth(year, monthIndex);
  // Simple weeks: 1–7, 8–14, 15–21, 22–28, 29–end
  const weeks = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, 28],
  ];
  if (lastDay > 28) weeks.push([29, lastDay]);

  const spending = monthTransactions.filter((transaction) =>
    isSpendingCategory(getCategory(transaction.category)),
  );
  const weekTotals = weeks.map(
    ([start, end]) =>
      -sumBy(
        spending.filter((transaction) => {
          const day = Number(transaction.date.slice(8, 10));
          return day >= start && day <= end;
        }),
        (transaction) => transaction.amount,
      ),
  );

  const largest = Math.max(...weekTotals, 1);
  const monthShort = MONTH_NAMES[monthIndex].slice(0, 3);

  $("#weeklySpending").innerHTML = weeks
    .map(
      ([start, end], index) => `
    <div class="week-row">
      <span class="week-label">${monthShort} ${start}-${end}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(weekTotals[index] / largest) * 100}%"></div></div>
      <span>${formatMoney(weekTotals[index])}</span>
    </div>`,
    )
    .join("");

  // Average only counts weeks that have already started
  const currentMonth = monthKey(todayISO);
  let startedWeeks = 0;
  if (selectedMonth < currentMonth) startedWeeks = weeks.length;
  else if (selectedMonth === currentMonth)
    startedWeeks = weeks.filter(([start]) => start <= today.getDate()).length;

  const monthTotal = sumBy(weekTotals, (total) => total);
  const weeklyAverage = startedWeeks ? monthTotal / startedWeeks : 0;
  $("#weeklyFooter").textContent =
    `Month to date: ${formatMoney(monthTotal)} · Avg/week: ${formatMoney(weeklyAverage)}`;
}

function renderTopCategories(actualByCategory) {
  const items = state.categories
    .filter(isSpendingCategory)
    .map((category) => ({
      label: category.name,
      icon: category.icon,
      value: -(actualByCategory[category.name] || 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (!items.length) {
    $("#topCategories").innerHTML = `
      <div class="donut donut-empty">
        <div class="donut-hole"><span class="donut-tag">Top 8</span><strong>No activity yet</strong><small>Your busiest categories will land here.</small></div>
      </div>
      <p class="empty-note">Your top categories list will populate after spending is categorized.</p>`;
    return;
  }

  // Build the donut with a conic-gradient: each slice gets its share of 360°
  const total = sumBy(items, (item) => item.value);
  let angle = 0;
  const slices = items.map((item, index) => {
    const start = angle;
    angle += (item.value / total) * 360;
    return `${CHART_COLORS[index]} ${start}deg ${angle}deg`;
  });

  const legend = items
    .map(
      (item, index) => `
    <li>
      <span class="legend-dot" style="background:${CHART_COLORS[index]}"></span>
      <span class="legend-name">${item.icon} ${escapeHtml(item.label)}</span>
      <span>${formatMoney(item.value)}</span>
      <span class="legend-percent">${Math.round((item.value / total) * 100)}%</span>
    </li>`,
    )
    .join("");

  $("#topCategories").innerHTML = `
    <div class="donut" style="background: conic-gradient(${slices.join(", ")})">
      <div class="donut-hole"><span class="donut-tag">Top 8</span><strong>${formatMoney(total)}</strong><small>spent</small></div>
    </div>
    <ul class="legend-list">${legend}</ul>`;
}

function renderCategoryGroups(actualByCategory) {
  $("#categoryGroups").innerHTML = GROUPS.filter((group) => group !== "Income")
    .map((group) => {
      const categories = state.categories.filter(
        (category) => category.group === group,
      );
      const expected = sumBy(categories, (category) => category.budget);
      const spent = -sumBy(
        categories,
        (category) => actualByCategory[category.name] || 0,
      );
      const percent = expected ? (spent / expected) * 100 : 0;

      return `
      <div class="group-progress">
        <div class="group-progress-top"><span>${group}</span><span>${formatMoney(spent)} / ${formatMoney(expected)}</span></div>
        <div class="bar-track"><div class="bar-fill ${percent > 100 ? "is-over" : ""}" style="width:${Math.min(percent, 100)}%"></div></div>
      </div>`;
    })
    .join("");
}

function renderCumulativeChart(monthTransactions, year, monthIndex) {
  const lastDay = daysInMonth(year, monthIndex);
  const currentMonth = monthKey(todayISO);

  // How many days of "actual" to draw: whole month (past), up to today (current), none (future)
  let daysToShow = 0;
  if (selectedMonth < currentMonth) daysToShow = lastDay;
  else if (selectedMonth === currentMonth) daysToShow = today.getDate();

  const budgetTotal = sumBy(
    state.categories.filter(isSpendingCategory),
    (category) => category.budget,
  );

  // Spending per day, then a running total
  const dailySpend = new Array(lastDay + 1).fill(0);
  monthTransactions.forEach((transaction) => {
    if (isSpendingCategory(getCategory(transaction.category))) {
      dailySpend[Number(transaction.date.slice(8, 10))] -= transaction.amount;
    }
  });
  const cumulative = [];
  let runningTotal = 0;
  for (let day = 1; day <= daysToShow; day += 1) {
    runningTotal += dailySpend[day];
    cumulative.push(runningTotal);
  }

  // Map days/amounts to SVG coordinates
  const width = 320;
  const height = 160;
  const padding = 10;
  const maxValue = Math.max(budgetTotal, runningTotal, 1);
  const x = (day) =>
    padding + ((day - 1) / (lastDay - 1)) * (width - padding * 2);
  const y = (value) =>
    height - padding - (value / maxValue) * (height - padding * 2);

  const budgetLine = `${x(1)},${y(budgetTotal / lastDay)} ${x(lastDay)},${y(budgetTotal)}`;
  const actualLine = cumulative
    .map((value, index) => `${x(index + 1)},${y(value)}`)
    .join(" ");
  const lastPoint = cumulative.length
    ? `<circle class="chart-dot" cx="${x(cumulative.length)}" cy="${y(runningTotal)}" r="4" />`
    : "";

  $("#cumulativeChart").innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Cumulative spending compared with budget pace">
      <line class="chart-grid" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" />
      <line class="chart-grid" x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" />
      <polyline class="line-budget" points="${budgetLine}" />
      ${actualLine ? `<polyline class="line-actual" points="${actualLine}" />` : ""}
      ${lastPoint}
    </svg>
    <p class="chart-caption">Spent ${formatMoney(runningTotal)} of ${formatMoney(budgetTotal)}</p>`;
}

/* ---------- 11. PAGE: YEARLY OVERVIEW ---------- */

function renderYearly() {
  // Year dropdown: every year that has transactions, plus this year
  const years = new Set([
    today.getFullYear(),
    ...state.transactions.map((t) => Number(t.date.slice(0, 4))),
  ]);
  $("#yearPicker").innerHTML = [...years]
    .sort((a, b) => b - a)
    .map(
      (year) =>
        `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`,
    )
    .join("");
  $("#yearlyTitle").textContent = `${selectedYear} Yearly Overview`;

  const yearTransactions = state.transactions.filter(
    (transaction) =>
      transaction.date.startsWith(String(selectedYear)) &&
      !isFuture(transaction.date),
  );
  const totals = totalsByCategory(yearTransactions);
  const totalFor = (category) => totals[category.name] || 0;
  const spentFor = (category) => -totalFor(category);

  // Top stat tiles
  const gross = sumBy(
    state.categories.filter((c) => c.kind === "income"),
    totalFor,
  );
  const tax = -sumBy(
    state.categories.filter((c) => c.kind === "tax"),
    totalFor,
  );
  $("#ytdGross").textContent = formatMoney(gross);
  $("#ytdTax").textContent = formatMoney(tax);
  $("#ytdNet").textContent = formatMoney(gross - tax);

  // Spending by group (Housing, Necessities, Wants)
  const groupItems = GROUPS.filter(
    (group) => group !== "Income" && group !== "Savings",
  )
    .map((group) => ({
      label: group,
      value: sumBy(
        state.categories.filter((c) => c.group === group),
        spentFor,
      ),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  $("#ytdGroups").innerHTML = renderBarList(
    groupItems,
    "No YTD category spending to chart yet.",
  );

  // Savings mix
  const savingsItems = state.categories
    .filter((category) => category.kind === "savings")
    .map((category) => ({
      label: category.name,
      icon: category.icon,
      value: spentFor(category),
    }))
    .filter((item) => item.value > 0);
  $("#ytdSavings").innerHTML = savingsItems.length
    ? `${renderBarList(savingsItems)}<div class="kv-row"><span>Total saved</span><strong>${formatMoney(sumBy(savingsItems, (i) => i.value))}</strong></div>`
    : '<p class="empty-note">No YTD savings data to chart yet.</p>';

  // Top spending categories
  const categoryItems = state.categories
    .filter(isSpendingCategory)
    .map((category) => ({
      label: category.name,
      icon: category.icon,
      value: spentFor(category),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  $("#ytdTopCategories").innerHTML = renderBarList(
    categoryItems,
    "No YTD category spending to chart yet.",
  );

  // Spending per month
  const monthItems = MONTH_NAMES.map((monthName, monthIndex) => {
    const key = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    const value = -sumBy(
      yearTransactions.filter(
        (t) =>
          monthKey(t.date) === key &&
          isSpendingCategory(getCategory(t.category)),
      ),
      (t) => t.amount,
    );
    return { label: monthName.slice(0, 3), fullLabel: monthName, value };
  });
  $("#ytdMonthlySpend").innerHTML = renderColumnChart(
    monthItems,
    "No YTD monthly spending to chart yet.",
  );

  // Top 3 months
  const medals = ["🥇", "🥈", "🥉"];
  const rankedMonths = monthItems
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  $("#ytdTopMonths").innerHTML =
    `<p class="stat-label">Top spending months</p>` +
    (rankedMonths.length
      ? `<ol class="ranked-list">${rankedMonths.map((item, index) => `<li><span>${medals[index]} ${item.fullLabel}</span><strong>${formatMoney(item.value)}</strong></li>`).join("")}</ol>`
      : '<p class="big-number">No spending yet</p>');

  // Average: this year counts months so far, past years count all 12
  let monthsIncluded = 0;
  if (selectedYear < today.getFullYear()) monthsIncluded = 12;
  else if (selectedYear === today.getFullYear())
    monthsIncluded = today.getMonth() + 1;
  const yearTotal = sumBy(monthItems, (item) => item.value);
  const monthlyAverage = monthsIncluded ? yearTotal / monthsIncluded : 0;
  $("#ytdAverage").innerHTML = `
    <p class="stat-label">YTD Monthly Average</p>
    <p class="big-number">${formatMoney(monthlyAverage)}</p>
    <div class="kv-row"><span>YTD Total Spend</span><strong>${formatMoney(yearTotal)}</strong></div>
    <div class="kv-row"><span>Months Included</span><strong>${monthsIncluded} Months</strong></div>`;

  // Wants vs needs (top 3 each)
  const topOfKind = (kind) =>
    state.categories
      .filter((category) => category.kind === kind)
      .map((category) => ({
        label: category.name,
        icon: category.icon,
        value: spentFor(category),
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  const wants = topOfKind("want");
  const needs = topOfKind("need");
  $("#ytdWantsNeeds").innerHTML =
    wants.length || needs.length
      ? `<div class="wants-needs">
         <div><h4>✨ Wants</h4>${renderBarList(wants, "None yet")}</div>
         <div><h4>🏡 Needs</h4>${renderBarList(needs, "None yet")}</div>
       </div>`
      : '<p class="empty-note">No wants or needs category spending to chart yet.</p>';
}

/* ---------- 12. PAGE: INCOME HISTORY ---------- */

function renderIncome() {
  const entries = [...state.incomeHistory].sort((a, b) => a.year - b.year);
  const birthYear = state.settings.birthYear;

  $("#salaryChart").innerHTML = renderSalaryChart(entries);

  const wageItems = entries
    .filter((entry) => entry.hourlyWage > 0)
    .map((entry) => ({
      label: String(entry.year),
      value: entry.hourlyWage,
      valueLabel: formatMoney(entry.hourlyWage),
    }));
  $("#hourlyChart").innerHTML = renderColumnChart(
    wageItems,
    "Add hourly wages to see bar chart.",
  );

  // Table shows newest year first
  $("#incomeTableBody").innerHTML = entries.length
    ? [...entries]
        .reverse()
        .map(
          (entry) => `
        <tr class="clickable-row" data-income-id="${entry.id}" tabindex="0">
          <td>${entry.year}</td>
          <td>${birthYear ? entry.year - birthYear : "—"}</td>
          <td>${entry.hourlyWage ? formatMoney(entry.hourlyWage) : "—"}</td>
          <td>${entry.salary ? formatMoney(entry.salary) : "—"}</td>
        </tr>`,
        )
        .join("")
    : '<tr><td colspan="4"><strong>No income history entries yet.</strong></td></tr>';
}

function renderSalaryChart(entries) {
  const points = entries.filter((entry) => entry.salary > 0);
  if (!points.length)
    return '<p class="empty-note">Add data to see salary trend.</p>';

  const width = 420;
  const height = 210;
  const paddingX = 40;
  const paddingY = 30;
  const maxSalary = Math.max(...points.map((point) => point.salary));
  const x = (index) =>
    points.length === 1
      ? width / 2
      : paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
  const y = (value) =>
    height - paddingY - (value / maxSalary) * (height - paddingY * 2);

  const line = points
    .map((point, index) => `${x(index)},${y(point.salary)}`)
    .join(" ");
  const dotsAndLabels = points
    .map(
      (point, index) => `
    <circle class="chart-dot" cx="${x(index)}" cy="${y(point.salary)}" r="5" />
    <text class="chart-text" x="${x(index)}" y="${y(point.salary) - 10}" text-anchor="middle">${formatCompactMoney(point.salary)}</text>
    <text class="chart-text" x="${x(index)}" y="${height - 6}" text-anchor="middle">${point.year}</text>`,
    )
    .join("");

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Salary by year">
      <line class="chart-grid" x1="${paddingX / 2}" y1="${height - paddingY}" x2="${width - paddingX / 2}" y2="${height - paddingY}" />
      <polyline class="line-actual" points="${line}" />
      ${dotsAndLabels}
    </svg>`;
}

/* ---------- 13. CHART HELPERS ---------- */

/** Horizontal bars. items: [{ label, value, icon? }] */
function renderBarList(items, emptyMessage = "") {
  if (!items.length) return `<p class="empty-note">${emptyMessage}</p>`;
  const largest = Math.max(...items.map((item) => item.value));

  return `<ul class="bar-list">${items
    .map(
      (item) => `
    <li>
      <div class="bar-list-top"><span>${item.icon ? `${item.icon} ` : ""}${escapeHtml(item.label)}</span><strong>${formatMoney(item.value)}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.value / largest) * 100}%"></div></div>
    </li>`,
    )
    .join("")}</ul>`;
}

/** Vertical bars. items: [{ label, value, valueLabel? }] */
function renderColumnChart(items, emptyMessage = "") {
  if (!items.some((item) => item.value > 0))
    return `<p class="empty-note">${emptyMessage}</p>`;
  const largest = Math.max(...items.map((item) => item.value));

  return `<div class="column-chart">${items
    .map(
      (item) => `
    <div class="column" title="${escapeHtml(item.label)}: ${formatMoney(item.value)}">
      ${item.valueLabel ? `<span class="column-value">${item.valueLabel}</span>` : ""}
      <div class="column-track"><div class="column-fill" style="height:${(item.value / largest) * 100}%"></div></div>
      <span class="column-label">${escapeHtml(item.label)}</span>
    </div>`,
    )
    .join("")}</div>`;
}

/* ---------- 14. MAGIC SPARKLE CURSOR TRAIL ----------
   Works like the classic "Tinkerbell Magic Sparkle" script: moving the
   mouse drops tiny coloured stars that drift down, shrink and fade.
   Each star is a <span> that deletes itself when its animation ends.
   The look and movement live in styles.css (.cursor-sparkle). */

const SPARKLE_COLORS = ["#ffffff"];
const MAX_SPARKLES = 60; // never more than this many on screen at once
const SPARKLE_GAP_MS = 25; // at most one new star every 25 milliseconds

let sparkleCount = 0;
let lastSparkleTime = 0;

function createSparkle(x, y) {
  if (sparkleCount >= MAX_SPARKLES) return;

  const sparkle = document.createElement("span");
  sparkle.className = "cursor-sparkle";
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  sparkle.style.color =
    SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];

  // Random drift, fall distance and speed make every star a little different
  sparkle.style.setProperty("--drift-x", `${(Math.random() - 0.5) * 40}px`);
  sparkle.style.setProperty("--fall-y", `${30 + Math.random() * 50}px`);
  sparkle.style.animationDuration = `${0.8 + Math.random() * 0.8}s`;

  sparkle.addEventListener("animationend", () => {
    sparkle.remove();
    sparkleCount -= 1;
  });

  document.body.appendChild(sparkle);
  sparkleCount += 1;
}

function initSparkleTrail() {
  // Only for a real mouse, and not for people who turn off animations
  const hasMouse = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!hasMouse || reduceMotion) return;

  document.addEventListener("mousemove", (event) => {
    const now = performance.now();
    if (now - lastSparkleTime < SPARKLE_GAP_MS) return;
    lastSparkleTime = now;
    createSparkle(event.clientX, event.clientY);
  });
}

/* ---------- 15. EVENT LISTENERS & STARTUP ---------- */

function bindEvents() {
  // Navigation uses the URL hash (#home, #monthly...)
  window.addEventListener("hashchange", () => {
    if (activeProfile) showPage(location.hash.slice(1)); // ignored on the welcome page
  });

  // Welcome page buttons
  $("#enterExampleButton").addEventListener("click", () =>
    enterProfile("example"),
  );
  $("#enterNewUserButton").addEventListener("click", () =>
    enterProfile("user"),
  );

  // Header
  $("#currencySelect").addEventListener("change", (event) => {
    state.settings.currency = event.target.value;
    saveState();
    renderAll();
  });
  $("#userButton").addEventListener("click", openUserModal);
  $("#openUserFromIncome").addEventListener("click", openUserModal);

  // Customize buttons (one per page)
  document.querySelectorAll("[data-customize]").forEach((button) => {
    button.addEventListener("click", openCustomizeModal);
  });

  // Home
  document.querySelectorAll("[data-assets]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.showAssets = button.dataset.assets === "on";
      saveState();
      renderHome();
    });
  });
  $("#addAccountButton").addEventListener("click", () =>
    openBalanceItemModal("accounts"),
  );
  $("#addAssetButton").addEventListener("click", () =>
    openBalanceItemModal("assets"),
  );
  $("#accountsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-item-id]");
    if (button)
      openBalanceItemModal(
        "accounts",
        state.accounts.find((a) => a.id === button.dataset.itemId),
      );
  });
  $("#assetsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-item-id]");
    if (button)
      openBalanceItemModal(
        "assets",
        state.assets.find((a) => a.id === button.dataset.itemId),
      );
  });
  $("#homeNewTransactionButton").addEventListener("click", () =>
    openTransactionModal(),
  );

  // Any click on a transaction (home list, table row or card) opens it for editing
  document.addEventListener("click", (event) => {
    const element = event.target.closest("[data-transaction-id]");
    if (!element) return;
    const transaction = state.transactions.find(
      (t) => t.id === element.dataset.transactionId,
    );
    if (transaction) openTransactionModal(transaction);
  });

  // Table rows are focusable – Enter opens them like a click
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.matches("tr.clickable-row"))
      event.target.click();
  });

  // All Transactions filters
  [
    "#filterSearch",
    "#filterRange",
    "#filterFlow",
    "#filterCategory",
    "#filterView",
  ].forEach((selector) => {
    $(selector).addEventListener("input", renderTransactions);
  });
  document.querySelectorAll("[data-future]").forEach((button) => {
    button.addEventListener("click", () => {
      showFutureTransactions = button.dataset.future === "show";
      renderTransactions();
    });
  });
  $("#resetFiltersButton").addEventListener("click", resetTransactionFilters);
  $("#newTransactionButton").addEventListener("click", () =>
    openTransactionModal(),
  );
  $("#toggleFiltersButton").addEventListener("click", (event) => {
    const filtersBody = $("#filtersBody");
    filtersBody.hidden = !filtersBody.hidden;
    event.currentTarget.textContent = filtersBody.hidden ? "SHOW ▾" : "HIDE ▴";
    event.currentTarget.setAttribute(
      "aria-expanded",
      String(!filtersBody.hidden),
    );
  });

  // Monthly
  $("#monthPicker").addEventListener("change", (event) => {
    selectedMonth = event.target.value || monthKey(todayISO);
    renderMonthly();
  });
  $("#moneyModeSelect").addEventListener("change", renderMonthly);
  $("#categoryBreakdown").addEventListener("click", (event) => {
    const button = event.target.closest("[data-budget-category]");
    if (button) openBudgetModal(button.dataset.budgetCategory);
  });

  // Yearly
  $("#yearPicker").addEventListener("change", (event) => {
    selectedYear = Number(event.target.value);
    renderYearly();
  });

  // Income history
  $("#addIncomeEntryButton").addEventListener("click", () =>
    openIncomeEntryModal(),
  );
  $("#incomeTableBody").addEventListener("click", (event) => {
    const row = event.target.closest("[data-income-id]");
    if (row)
      openIncomeEntryModal(
        state.incomeHistory.find((entry) => entry.id === row.dataset.incomeId),
      );
  });

  // Pop-up form
  $("#dialogForm").addEventListener("submit", handleDialogSubmit);
  $("#dialogDeleteButton").addEventListener("click", handleDialogDelete);
  $("#dialogExtraButton").addEventListener("click", () => {
    const action = activeDialog?.extraButton?.onClick;
    closeDialog();
    if (action) action();
  });
  $("#dialogCancelButton").addEventListener("click", closeDialog);
  $("#dialogCloseButton").addEventListener("click", closeDialog);
  $("#formDialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeDialog(); // clicked the dark backdrop
  });

  // Stop images and icons from being saved with right-click or dragged out
  document.addEventListener("contextmenu", (event) => {
    if (event.target.closest("img")) event.preventDefault();
  });
  document.addEventListener("dragstart", (event) => {
    if (event.target.closest("img")) event.preventDefault();
  });

  // Theme button (bottom right): one click flips light ↔ dark
  $("#themeToggle").addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    writeStorage(STORAGE_KEYS.theme, currentTheme);
    applyTheme();
  });
}

function init() {
  currentTheme = readStorage(STORAGE_KEYS.theme) === "dark" ? "dark" : "light";
  applyTheme();

  // Cards are easier to read on small phone screens
  $("#filterView").value = window.matchMedia("(max-width: 640px)").matches
    ? "cards"
    : "table";

  bindEvents();
  initSparkleTrail();

  // Reopen the budget that was open last time; otherwise show the welcome page
  const lastProfile = readStorage(STORAGE_KEYS.activeProfile);
  if (lastProfile === "example" || lastProfile === "user") {
    activeProfile = lastProfile;
    state = loadState(lastProfile);
    showApp(location.hash.slice(1));
  } else {
    showWelcome();
  }
}

init();
