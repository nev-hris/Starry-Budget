/* The pop-up itself (a native <dialog>), filled in from a FormConfig */

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import type { FormConfig, FormField, FormValues, SelectOption } from "./FormContext";
import YearWheelField from "./YearWheelField";

interface Props {
  config: FormConfig | null;
  onClose: () => void;
}

export default function FormDialog({ config, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");

  // Open the dialog when there is a config, close it when there isn't
  useEffect(() => {
    const dialog = dialogRef.current!;
    if (config && !dialog.open) {
      dialog.showModal();
      // Put the cursor in the first box
      const firstInput = formRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select',
      );
      firstInput?.focus();
    }
    if (!config && dialog.open) dialog.close();
  }, [config]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;

    // Read every field's value straight from the form
    const elements = formRef.current!.elements;
    const values: FormValues = {};
    config.fields.forEach((field) => {
      const input = elements.namedItem(field.name) as HTMLInputElement;
      values[field.name] = field.type === "checkbox" ? input.checked : input.value.trim();
    });

    const errorMessage = config.onSubmit(values);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }
    onClose();
  }

  function handleDelete() {
    if (!config?.onDelete) return;
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    config.onDelete();
    onClose();
  }

  function handleExtraButton() {
    const action = config?.extraButton?.onClick;
    onClose();
    if (action) action();
  }

  return (
    <dialog
      className="modal"
      id="formDialog"
      ref={dialogRef}
      onClose={onClose} // e.g. the Escape key
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose(); // clicked the dark backdrop
      }}
    >
      <form ref={formRef} className="modal-form" noValidate onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2 id="dialogTitle">{config?.title ?? "Title"}</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-fields">
          {config?.fields.map((field) => <Field key={field.name} field={field} />)}
        </div>

        <p className="form-error" role="alert">
          {error}
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-danger"
            hidden={!config?.onDelete}
            onClick={handleDelete}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn"
            id="dialogExtraButton"
            hidden={!config?.extraButton}
            onClick={handleExtraButton}
          >
            {config?.extraButton?.label}
          </button>
          <span className="flex-1"></span>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {config?.submitLabel ?? "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

/** One field of the form */
function Field({ field }: { field: FormField }) {
  const id = `field-${field.name}`;
  const value = field.value ?? "";

  if (field.type === "yearWheel") return <YearWheelField field={field} />;

  if (field.type === "checkbox") {
    return (
      <label className="checkbox-field" htmlFor={id}>
        <input type="checkbox" id={id} name={field.name} defaultChecked={Boolean(field.value)} />
        <span>{field.label}</span>
      </label>
    );
  }

  let control;
  if (field.type === "select") {
    control = (
      <select className="input" id={id} name={field.name} defaultValue={String(value)}>
        <Options options={field.options ?? []} />
      </select>
    );
  } else {
    const isNumber = field.type === "number";
    control = (
      <input
        className="input"
        type={field.type || "text"}
        id={id}
        name={field.name}
        defaultValue={String(value)}
        placeholder={field.placeholder || ""}
        step={isNumber ? (field.step ?? "any") : undefined}
        min={isNumber ? (field.min ?? "") : undefined}
        inputMode={isNumber ? "decimal" : undefined}
      />
    );
  }

  return (
    <label className="form-field" htmlFor={id}>
      <span>{field.label}</span>
      {control}
      {field.help && <small>{field.help}</small>}
    </label>
  );
}

/** <option>s; options that share a "group" are wrapped in one <optgroup> */
export function Options({ options }: { options: SelectOption[] }) {
  // Collect the options into runs of the same group, in order
  const runs: { group?: string; options: SelectOption[] }[] = [];
  options.forEach((option) => {
    const lastRun = runs[runs.length - 1];
    if (lastRun && lastRun.group === option.group) lastRun.options.push(option);
    else runs.push({ group: option.group, options: [option] });
  });

  return runs.map((run, index) => {
    const items = run.options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ));
    return run.group ? (
      <optgroup key={run.group} label={run.group}>
        {items}
      </optgroup>
    ) : (
      <Fragment key={index}>{items}</Fragment>
    );
  });
}
