/* The starting point: puts <App /> into <div id="root"> in index.html */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BudgetProvider } from "./state/BudgetContext";
import { FormProvider } from "./forms/FormContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BudgetProvider>
      <FormProvider>
        <App />
      </FormProvider>
    </BudgetProvider>
  </StrictMode>,
);
