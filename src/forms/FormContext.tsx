/* =========================================================
   ONE REUSABLE POP-UP FORM
   ---------------------------------------------------------
   Any component can open the pop-up:
     const { openForm } = useForm();
     openForm({ title, fields, onSubmit, onDelete, extraButton });

   - fields:      [{ name, label, type, value, options, help, placeholder, min, step }]
                  type can also be 'yearWheel' (scrollable birth-year picker)
   - onSubmit:    receives the values; return an error message to keep the form open
   - onDelete:    optional; shows the Delete button
   - extraButton: optional { label, onClick }; an extra button under the others
   ========================================================= */

import { createContext, useContext, useState, type ReactNode } from "react";
import FormDialog from "./FormDialog";

export interface SelectOption {
  value: string;
  label: string;
  group?: string; // options with a group are wrapped in <optgroup>
}

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "checkbox" | "yearWheel";
  value?: string | number | boolean | null;
  options?: SelectOption[];
  help?: string;
  placeholder?: string;
  min?: number;
  step?: number;
}

/** Text fields give a string, checkboxes give true/false */
export type FormValues = Record<string, string | boolean>;

export interface FormConfig {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit: (values: FormValues) => string | null;
  onDelete?: (() => void) | null;
  extraButton?: { label: string; onClick: () => void } | null;
}

interface FormContextValue {
  openForm: (config: FormConfig) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  // Goes up by 1 each time a form opens, so the inputs start fresh
  const [openCount, setOpenCount] = useState(0);

  function openForm(newConfig: FormConfig) {
    setConfig(newConfig);
    setOpenCount((count) => count + 1);
  }

  return (
    <FormContext.Provider value={{ openForm }}>
      {children}
      <FormDialog key={openCount} config={config} onClose={() => setConfig(null)} />
    </FormContext.Provider>
  );
}

export function useForm() {
  const value = useContext(FormContext);
  if (!value) throw new Error("useForm must be used inside <FormProvider>");
  return value;
}
