"use client";

import type { ReactNode } from "react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions/state";

/** A compact single-button form for one server action, with optional confirmation. */
export function InlineAction({
  action,
  fields,
  label,
  pendingLabel,
  variant = "secondary",
  confirm,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "quiet";
  confirm?: { title: string; body: ReactNode; confirmLabel?: string };
}) {
  return (
    <ActionForm action={action} className="inline-block">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {confirm ? (
        <ConfirmSubmit title={confirm.title} body={confirm.body} confirmLabel={confirm.confirmLabel} variant={variant === "danger" ? "danger" : "primary"}>
          {label}
        </ConfirmSubmit>
      ) : (
        <SubmitButton size="sm" variant={variant} pendingLabel={pendingLabel ?? "Working…"}>{label}</SubmitButton>
      )}
    </ActionForm>
  );
}
