"use client";

import { ActionForm, CheckboxField, ConfirmSubmit, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import {
  acceptanceAction,
  cancelAssignmentAction,
  confirmAssignmentAction,
  transitionAssignmentAction,
} from "@/app/admin/actions/assignments";
import { addAdjustmentAction, correctCommissionAction, recordPaymentAction, reversePaymentAction } from "@/app/admin/actions/finance";
import { ASSIGNMENT_STATUS_LABELS, PAYMENT_DIRECTION_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/domain/labels";
import type { AssignmentStatus } from "@/generated/prisma/enums";

export function AcceptanceToggle({ assignmentId, party, accepted }: { assignmentId: string; party: "customer" | "caregiver"; accepted: boolean }) {
  return (
    <ActionForm action={acceptanceAction}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="party" value={party} />
      <input type="hidden" name="accepted" value={accepted ? "no" : "yes"} />
      <SubmitButton size="sm" variant={accepted ? "quiet" : "secondary"}>
        {accepted ? "Withdraw" : `Record ${party} acceptance`}
      </SubmitButton>
    </ActionForm>
  );
}

export function ConfirmAssignmentForm({ assignmentId, summary }: { assignmentId: string; summary: string }) {
  return (
    <ActionForm action={confirmAssignmentAction}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <ConfirmSubmit title="Confirm this assignment?" body={summary} confirmLabel="Confirm assignment" variant="primary" size="md">
        Confirm assignment
      </ConfirmSubmit>
    </ActionForm>
  );
}

export function TransitionForm({ assignmentId, options }: { assignmentId: string; options: AssignmentStatus[] }) {
  if (options.length === 0) return null;
  return (
    <ActionForm action={transitionAssignmentAction} className="grid gap-3" resetOnSuccess>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <SelectField name="toStatus" label="Move to" required placeholder="Choose" options={options.map((s) => ({ value: s, label: ASSIGNMENT_STATUS_LABELS[s] }))} />
      <TextField name="note" label="Note" />
      <div><SubmitButton size="sm" variant="secondary">Update</SubmitButton></div>
    </ActionForm>
  );
}

export function CancelForm({ assignmentId, confirmed, finance, currentCharge, currentPayout }: { assignmentId: string; confirmed: boolean; finance: boolean; currentCharge: string; currentPayout: string }) {
  return (
    <ActionForm action={cancelAssignmentAction} className="grid gap-3">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <TextareaField name="reason" label="Reason for cancellation" required rows={2} />
      {confirmed && finance && (
        <>
          <p className="text-xs text-muted">
            Enter what is still payable for service already given. The difference is recorded as an adjustment, so the original agreement stays on record.
          </p>
          <TextField name="finalCustomerCharge" label="Final customer charge (₹)" inputMode="decimal" defaultValue={currentCharge} />
          <TextField name="finalCaregiverPayout" label="Final caregiver payout (₹)" inputMode="decimal" defaultValue={currentPayout} />
          <CheckboxField name="reverseCommission" label="Reverse the commission recorded for this placement" />
        </>
      )}
      <div>
        <ConfirmSubmit title="Cancel this assignment?" body="This cannot be undone. The history and any payments stay on record." confirmLabel="Cancel assignment">
          Cancel assignment
        </ConfirmSubmit>
      </div>
    </ActionForm>
  );
}

export function PaymentForm({ assignmentId, today }: { assignmentId: string; today: string }) {
  return (
    <ActionForm action={recordPaymentAction} className="grid gap-3 sm:grid-cols-2" resetOnSuccess>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <SelectField name="direction" label="Type" required defaultValue="CUSTOMER_RECEIPT" options={Object.entries(PAYMENT_DIRECTION_LABELS).map(([value, label]) => ({ value, label }))} />
      <TextField name="amount" label="Amount (₹)" inputMode="decimal" required />
      <SelectField name="method" label="Method" required defaultValue="UPI" options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))} />
      <TextField name="methodNote" label="If other, which method?" />
      <TextField name="paidOn" label="Date paid" type="date" required defaultValue={today} max={today} />
      <TextField name="transactionRef" label="Transaction reference" placeholder="UPI ref, UTR, receipt no." />
      <TextField name="notes" label="Notes" className="sm:col-span-2" />
      <div className="sm:col-span-2"><SubmitButton size="sm">Record payment</SubmitButton></div>
    </ActionForm>
  );
}

export function ReversePaymentForm({ paymentId, assignmentId }: { paymentId: string; assignmentId: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer list-none font-medium text-rose-700 hover:underline [&::-webkit-details-marker]:hidden">Reverse…</summary>
      <ActionForm action={reversePaymentAction} className="mt-2 grid gap-2">
        <input type="hidden" name="paymentId" value={paymentId} />
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <TextField name="reason" label="Reason" required />
        <div>
          <ConfirmSubmit title="Reverse this payment?" body="A reversal entry is added. The original payment stays in the ledger." confirmLabel="Add reversal">
            Add reversal entry
          </ConfirmSubmit>
        </div>
      </ActionForm>
    </details>
  );
}

export function AdjustmentForm({ assignmentId }: { assignmentId: string }) {
  return (
    <ActionForm action={addAdjustmentAction} className="grid gap-3 sm:grid-cols-2" resetOnSuccess>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <SelectField name="target" label="Adjust" required defaultValue="CUSTOMER_CHARGE" options={[{ value: "CUSTOMER_CHARGE", label: "Customer charge" }, { value: "CAREGIVER_PAYOUT", label: "Caregiver payout" }]} />
      <TextField name="amount" label="Amount (₹, negative to reduce)" inputMode="decimal" required placeholder="e.g. 2200 or -1100" />
      <TextField name="reason" label="Reason" required className="sm:col-span-2" />
      <div className="sm:col-span-2"><SubmitButton size="sm" variant="secondary">Record adjustment</SubmitButton></div>
    </ActionForm>
  );
}

export function CorrectCommissionForm({ assignmentId }: { assignmentId: string }) {
  return (
    <ActionForm action={correctCommissionAction}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <SubmitButton size="sm" variant="quiet">Recalculate commission from current amounts</SubmitButton>
    </ActionForm>
  );
}
