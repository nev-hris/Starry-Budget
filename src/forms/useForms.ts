/* =========================================================
   FORMS FOR EACH KIND OF ITEM
   ---------------------------------------------------------
   const forms = useForms();
   forms.openTransaction();            // new transaction
   forms.openTransaction(transaction); // edit one
   ========================================================= */

import { OLDEST_BIRTH_YEAR } from "../config/defaults";
import { createFreshBudget } from "../lib/budget";
import { createId, today, todayISO } from "../lib/dates";
import { useMoney } from "../hooks/useMoney";
import { useOpenBudget } from "../state/BudgetContext";
import type { BalanceItem, Budget, IncomeEntry, Transaction } from "../types";
import { useForm, type SelectOption } from "./FormContext";
import { isValidBirthYear } from "./YearWheelField";

/** Every category as a dropdown option, grouped by budget group */
export function categoryOptions(budget: Budget): SelectOption[] {
  return budget.categories.map((category) => ({
    value: category.name,
    label: `${category.icon} ${category.name}`,
    group: category.group,
  }));
}

export function useForms() {
  const { budget, profile, updateBudget, setBudget, getCategory, showWelcome } = useOpenBudget();
  const { openForm } = useForm();
  const { currencyCode, toRSD, toDisplayNumber } = useMoney();

  /** Accounts and assets work the same way: a name and an amount */
  function openBalanceItem(listName: "accounts" | "assets", item: BalanceItem | null = null) {
    const isEditing = Boolean(item);
    const singular = listName === "accounts" ? "Account" : "Asset";

    openForm({
      title: `${isEditing ? "Edit" : "Add"} ${singular}`,
      fields: [
        {
          name: "name",
          label: `${singular} name`,
          value: item?.name,
          placeholder: listName === "accounts" ? "e.g. Checking Account" : "e.g. Car",
        },
        {
          name: "amount",
          label: `${listName === "accounts" ? "Balance" : "Value"} (${currencyCode})`,
          type: "number",
          value: item ? toDisplayNumber(item.amount) : "",
        },
      ],
      onSubmit: (values) => {
        const name = values.name as string;
        const amount = values.amount as string;
        if (!name) return "Please enter a name.";
        if (amount === "" || Number.isNaN(Number(amount))) return "Please enter a valid amount.";

        updateBudget((draft) => {
          if (item) {
            const saved = draft[listName].find((entry) => entry.id === item.id)!;
            Object.assign(saved, { name, amount: toRSD(amount) });
          } else {
            draft[listName].push({ id: createId(), name, amount: toRSD(amount) });
          }
        });
        return null;
      },
      onDelete: item
        ? () =>
            updateBudget((draft) => {
              draft[listName] = draft[listName].filter((entry) => entry.id !== item.id);
            })
        : null,
    });
  }

  function openTransaction(transaction: Transaction | null = null) {
    openForm({
      title: transaction ? "Edit Transaction" : "New Transaction",
      fields: [
        { name: "date", label: "Date", type: "date", value: transaction?.date ?? todayISO },
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
          options: categoryOptions(budget),
        },
        {
          name: "amount",
          label: `Amount (${currencyCode})`,
          type: "number",
          min: 0,
          value: transaction ? toDisplayNumber(Math.abs(transaction.amount)) : "",
          help: "Enter a positive number. Income categories add money, all others subtract it.",
        },
      ],
      onSubmit: (values) => {
        const date = values.date as string;
        const description = values.description as string;
        const category = values.category as string;
        const number = Number(values.amount);
        if (!date) return "Please choose a date.";
        if (!description) return "Please add a description.";
        if (!(number > 0)) return "Amount must be greater than 0.";

        // The category decides if the amount is money in (+) or out (-)
        const amountRSD = toRSD(number);
        const signedAmount = getCategory(category)?.direction === "in" ? amountRSD : -amountRSD;

        updateBudget((draft) => {
          if (transaction) {
            const saved = draft.transactions.find((entry) => entry.id === transaction.id)!;
            Object.assign(saved, { date, description, category, amount: signedAmount });
          } else {
            draft.transactions.push({
              id: createId(),
              date,
              description,
              category,
              amount: signedAmount,
            });
          }
        });
        return null;
      },
      onDelete: transaction
        ? () =>
            updateBudget((draft) => {
              draft.transactions = draft.transactions.filter((entry) => entry.id !== transaction.id);
            })
        : null,
    });
  }

  function openBudget(categoryName: string) {
    const category = getCategory(categoryName)!;

    openForm({
      title: `${category.icon} ${category.name} budget`,
      fields: [
        {
          name: "budget",
          label: `Expected per month (${currencyCode})`,
          type: "number",
          min: 0,
          value: toDisplayNumber(category.budget),
        },
      ],
      onSubmit: (values) => {
        const text = values.budget as string;
        const number = Number(text);
        if (text === "" || Number.isNaN(number) || number < 0) return "Please enter 0 or more.";
        updateBudget((draft) => {
          draft.categories.find((item) => item.name === categoryName)!.budget = toRSD(number);
        });
        return null;
      },
    });
  }

  function openIncomeEntry(entry: IncomeEntry | null = null) {
    openForm({
      title: entry ? `Edit ${entry.year}` : "Add Income Entry",
      fields: [
        { name: "year", label: "Year", type: "number", step: 1, value: entry?.year ?? today.getFullYear() },
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
      onSubmit: (values) => {
        const yearNumber = Number(values.year);
        const hourlyWage = values.hourlyWage as string;
        const salary = values.salary as string;
        if (!Number.isInteger(yearNumber) || yearNumber < 1950 || yearNumber > 2100)
          return "Please enter a valid year.";
        if (!hourlyWage && !salary) return "Fill in an hourly wage, a salary, or both.";

        // Only one entry per year is allowed
        const duplicate = budget.incomeHistory.find(
          (item) => item.year === yearNumber && item.id !== entry?.id,
        );
        if (duplicate)
          return `There is already an entry for ${yearNumber}. Click it in the table to edit.`;

        const newValues = {
          year: yearNumber,
          hourlyWage: hourlyWage ? toRSD(hourlyWage) : null,
          salary: salary ? toRSD(salary) : null,
        };

        updateBudget((draft) => {
          if (entry) {
            Object.assign(draft.incomeHistory.find((item) => item.id === entry.id)!, newValues);
          } else {
            draft.incomeHistory.push({ id: createId(), ...newValues });
          }
        });
        return null;
      },
      onDelete: entry
        ? () =>
            updateBudget((draft) => {
              draft.incomeHistory = draft.incomeHistory.filter((item) => item.id !== entry.id);
            })
        : null,
    });
  }

  function openUser() {
    const isExample = profile === "example";

    openForm({
      title: isExample ? "Your User (example)" : "Your User",
      fields: [
        { name: "userName", label: "Name", value: budget.settings.userName, placeholder: "Your name" },
        {
          name: "birthYear",
          label: "Birth year (used to work out your age)",
          type: "yearWheel",
          value: budget.settings.birthYear ?? "",
        },
        {
          name: "resetData",
          label: isExample ? "Reset the example back to the start" : "Erase all my data and start empty",
          type: "checkbox",
          value: false,
        },
      ],
      extraButton: { label: "← Back to welcome page", onClick: showWelcome },
      onSubmit: (values) => {
        const userName = values.userName as string;
        const birthYear = values.birthYear as string;

        // A typed year must be a real year between 1901 and this year
        if (birthYear && !isValidBirthYear(birthYear)) {
          return `Please enter a birth year from ${OLDEST_BIRTH_YEAR} to ${today.getFullYear()}.`;
        }
        const yearNumber = birthYear ? Number(birthYear) : null;

        if (values.resetData) {
          const question = isExample
            ? "Restore the example to how it started?"
            : "This deletes everything you entered. Continue?";
          if (!window.confirm(question)) return "Reset cancelled.";

          const fresh = createFreshBudget(profile);
          fresh.settings.currency = budget.settings.currency;
          fresh.settings.userName = userName;
          fresh.settings.birthYear = yearNumber;
          setBudget(fresh);
          return null;
        }

        updateBudget((draft) => {
          draft.settings.userName = userName;
          draft.settings.birthYear = yearNumber;
        });
        return null;
      },
    });
  }

  /** "Customize" has one option: show or hide the animated illustrations (all pages) */
  function openCustomize() {
    openForm({
      title: "Customize",
      submitLabel: "Apply",
      fields: [
        {
          name: "showIllustrations",
          label: "Show animated illustrations",
          type: "checkbox",
          value: budget.settings.showIllustrations,
        },
      ],
      onSubmit: (values) => {
        updateBudget((draft) => {
          draft.settings.showIllustrations = values.showIllustrations as boolean;
        });
        return null;
      },
    });
  }

  return { openBalanceItem, openTransaction, openBudget, openIncomeEntry, openUser, openCustomize };
}
