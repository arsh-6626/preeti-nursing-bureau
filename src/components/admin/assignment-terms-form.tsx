"use client";

import { useState } from "react";
import { ActionForm, SelectField, SubmitButton, TextareaField, TextField } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions/state";
import { DURATION_UNIT_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, type ShiftType } from "@/lib/domain/shift";

export type TermsDefaults = {
  startDate: string;
  durationValue: number;
  durationUnit: "DAYS" | "WEEKS" | "MONTHS";
  quotedAmount: string;
  customerAmount: string;
  caregiverPayout: string;
  commissionMethod: "FIXED" | "PERCENTAGE";
  commissionRate: string;
  commissionFixedAmount: string;
  commissionBasis: "CUSTOMER_AMOUNT" | "CAREGIVER_PAYOUT";
  staffingPlan: string;
  financialNotes: string;
};

export function AssignmentTermsForm({
  action,
  hidden,
  shiftType,
  defaults,
  submitLabel,
  suggestion,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  shiftType: ShiftType;
  defaults: TermsDefaults;
  submitLabel: string;
  suggestion?: string;
}) {
  const [method, setMethod] = useState(defaults.commissionMethod);
  return (
    <ActionForm action={action} className="grid gap-6">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input type="hidden" name="shiftType" value={shiftType} />

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-navy-900">
          Schedule · <span className="text-teal-700">{SHIFT_LABELS[shiftType]}</span>
          <span className="block text-xs font-normal text-muted">The shift matches the customer&apos;s request and cannot be changed here.</span>
        </legend>
        <TextField name="startDate" label="Start date" type="date" required defaultValue={defaults.startDate} />
        <TextField name="durationValue" label="Duration" type="number" min={1} max={365} required defaultValue={defaults.durationValue} />
        <SelectField name="durationUnit" label="Unit" required defaultValue={defaults.durationUnit} options={Object.entries(DURATION_UNIT_LABELS).map(([value, label]) => ({ value, label }))} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-navy-900">
          Amounts for the whole arrangement (₹)
          {suggestion && <span className="block text-xs font-normal text-muted">{suggestion}</span>}
        </legend>
        <TextField name="quotedAmount" label="Quoted to customer" inputMode="decimal" defaultValue={defaults.quotedAmount} />
        <TextField name="customerAmount" label="Agreed customer amount" inputMode="decimal" required defaultValue={defaults.customerAmount} />
        <TextField name="caregiverPayout" label="Agreed caregiver payout" inputMode="decimal" required defaultValue={defaults.caregiverPayout} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-navy-900">
          Commission
          <span className="block text-xs font-normal text-muted">Defaults come from Settings. Commission is recorded only when the policy event happens (confirmation or completion).</span>
        </legend>
        <SelectField
          name="commissionMethod"
          label="Method"
          required
          value={method}
          onChange={(e) => setMethod(e.target.value as "FIXED" | "PERCENTAGE")}
          options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED", label: "Fixed per placement" }]}
        />
        {method === "PERCENTAGE" ? (
          <>
            <TextField name="commissionRate" label="Rate (%)" inputMode="decimal" required defaultValue={defaults.commissionRate} />
            <SelectField name="commissionBasis" label="Percentage of" required defaultValue={defaults.commissionBasis} options={[{ value: "CUSTOMER_AMOUNT", label: "Agreed customer amount" }, { value: "CAREGIVER_PAYOUT", label: "Agreed caregiver payout" }]} />
          </>
        ) : (
          <>
            <TextField name="commissionFixedAmount" label="Fixed amount (₹)" inputMode="decimal" required defaultValue={defaults.commissionFixedAmount} />
            <input type="hidden" name="commissionBasis" value={defaults.commissionBasis} />
          </>
        )}
      </fieldset>

      <TextareaField
        name="staffingPlan"
        label={shiftType === "24_HOURS" ? "Relief, rest and staffing plan" : "Staffing notes"}
        required={shiftType === "24_HOURS"}
        rows={3}
        defaultValue={defaults.staffingPlan}
        hint={shiftType === "24_HOURS" ? "Describe rest periods, who covers them, and any relief caregiver. No caregiver works 24 hours without breaks." : undefined}
      />
      <TextareaField name="financialNotes" label="Financial notes" rows={2} defaultValue={defaults.financialNotes} />
      <div><SubmitButton>{submitLabel}</SubmitButton></div>
    </ActionForm>
  );
}
