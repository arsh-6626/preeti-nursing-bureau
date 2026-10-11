"use client";

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions/state";
import { Button, buttonClass } from "./button";

type FormCtx = { fieldErrors: Record<string, string> };
const FormContext = createContext<FormCtx>({ fieldErrors: {} });

export function useFieldError(name: string): string | undefined {
  return useContext(FormContext).fieldErrors[name];
}

export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  onSuccess,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) formRef.current?.reset();
      onSuccessRef.current?.();
    }
  }, [state, resetOnSuccess]);
  return (
    <FormContext value={{ fieldErrors: state?.fieldErrors ?? {} }}>
      <form ref={formRef} action={formAction} className={className} noValidate>
        {state?.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`mb-4 rounded-[var(--radius-control)] border px-3 py-2 text-sm ${state.ok ? "border-leaf-600/20 bg-leaf-50 text-leaf-700" : "border-rose-700/20 bg-rose-50 text-rose-700"}`}
          >
            {state.message}
          </p>
        )}
        {children}
      </form>
    </FormContext>
  );
}

export function SubmitButton({ children, pendingLabel = "Saving…", ...props }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

const control =
  "block w-full rounded-[var(--radius-control)] border border-line-strong bg-paper px-3 text-[15px] text-navy-950 placeholder:text-muted/80 transition-colors hover:border-navy-800/40 focus:border-teal-600 focus:outline-2 focus:outline-offset-0 focus:outline-teal-600/30 disabled:bg-mist aria-invalid:border-rose-700";

export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-navy-900">
        {label}
        {required ? <span className="text-rose-700"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
}

type FieldBase = { name: string; label: ReactNode; hint?: ReactNode; className?: string; errorKey?: string };

export function TextField({ name, label, hint, className, errorKey, required, ...props }: FieldBase & ComponentProps<"input">) {
  const id = useId();
  const error = useFieldError(errorKey ?? name);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${control} h-11`}
        {...props}
      />
    </FieldShell>
  );
}

export function TextareaField({ name, label, hint, className, errorKey, required, ...props }: FieldBase & ComponentProps<"textarea">) {
  const id = useId();
  const error = useFieldError(errorKey ?? name);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={id}
        name={name}
        required={required}
        rows={props.rows ?? 3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${control} py-2.5 leading-relaxed`}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  className,
  errorKey,
  required,
  options,
  placeholder,
  ...props
}: FieldBase & ComponentProps<"select"> & { options: { value: string; label: string }[]; placeholder?: string }) {
  const id = useId();
  const error = useFieldError(errorKey ?? name);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${control} h-11 pr-8`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({ name, label, hint, className = "", ...props }: { name: string; label: ReactNode; hint?: ReactNode; className?: string } & ComponentProps<"input">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
        <input id={id} type="checkbox" name={name} className="mt-0.5 size-4.5 shrink-0 accent-teal-600" {...props} />
        <span>
          {label}
          {hint && <span className="block text-xs text-muted">{hint}</span>}
        </span>
      </label>
      {error && <p className="mt-1 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
}

export function CheckboxGroup({
  name,
  legend,
  options,
  defaultValues = [],
  hint,
  columns = 2,
}: {
  name: string;
  legend: ReactNode;
  options: { value: string; label: string }[];
  defaultValues?: string[];
  hint?: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  const error = useFieldError(name);
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[columns];
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-navy-900">{legend}</legend>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className={`mt-2 grid max-h-60 grid-cols-1 gap-2 overflow-y-auto ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-line px-3 py-2 text-sm hover:border-teal-600 has-checked:border-teal-600 has-checked:bg-teal-50">
            <input type="checkbox" name={name} value={o.value} defaultChecked={defaultValues.includes(o.value)} className="size-4 accent-teal-600" />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-700">{error}</p>}
    </fieldset>
  );
}

/** A submit button that asks for confirmation in a native dialog first. */
export function ConfirmSubmit({
  children,
  title,
  body,
  confirmLabel = "Confirm",
  variant = "danger",
  size = "sm",
  name,
  value,
}: {
  children: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  variant?: "danger" | "primary" | "secondary";
  size?: "sm" | "md";
  name?: string;
  value?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();
  const titleId = useId();
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={buttonClass(variant, size)}
        disabled={pending}
        onClick={() => dialogRef.current?.showModal()}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,440px)] rounded-[var(--radius-panel)] border border-line p-0 shadow-[var(--shadow-float)] backdrop:bg-navy-950/40"
      >
        <div className="p-5">
          <h2 id={titleId} className="text-base font-semibold text-navy-900">{title}</h2>
          <div className="mt-2 text-sm text-muted">{body}</div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={buttonClass("secondary", "sm")} onClick={() => dialogRef.current?.close()}>
              Go back
            </button>
            <button
              type="button"
              className={buttonClass(variant === "danger" ? "danger" : "primary", "sm")}
              onClick={() => {
                const form = triggerRef.current?.form;
                dialogRef.current?.close();
                if (!form) return;
                if (name) {
                  const hidden = document.createElement("input");
                  hidden.type = "hidden";
                  hidden.name = name;
                  hidden.value = value ?? "";
                  form.appendChild(hidden);
                  form.requestSubmit();
                  hidden.remove();
                } else {
                  form.requestSubmit();
                }
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
