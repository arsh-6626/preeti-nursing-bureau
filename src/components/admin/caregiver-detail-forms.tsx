"use client";

import { ActionForm, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import {
  addAvailabilityAction,
  addCaregiverNoteAction,
  addVerificationAction,
  setOverallVerificationAction,
  updateVerificationAction,
} from "@/app/admin/actions/caregivers";
import { AVAILABILITY_KIND_LABELS, VERIFICATION_STATUS_LABELS, VERIFICATION_TYPE_LABELS } from "@/lib/domain/labels";

const opts = (r: Record<string, string>) => Object.entries(r).map(([value, label]) => ({ value, label }));

export function AddVerificationForm({ caregiverId }: { caregiverId: string }) {
  return (
    <ActionForm action={addVerificationAction} className="grid gap-3 sm:grid-cols-2" resetOnSuccess>
      <input type="hidden" name="caregiverId" value={caregiverId} />
      <SelectField name="type" label="Check" required defaultValue="IDENTITY" options={opts(VERIFICATION_TYPE_LABELS)} />
      <SelectField name="status" label="Result" required defaultValue="PENDING" options={opts(VERIFICATION_STATUS_LABELS)} />
      <TextField name="documentRef" label="What was checked" hint="Describe the document. Do not type full ID numbers." />
      <TextField name="expiresAt" label="Expires on" type="date" />
      <TextField name="notes" label="Notes" className="sm:col-span-2" />
      <div className="sm:col-span-2"><SubmitButton size="sm" variant="secondary">Add record</SubmitButton></div>
    </ActionForm>
  );
}

export function UpdateVerificationForm({
  recordId,
  caregiverId,
  status,
  documentRef,
  expiresAt,
  notes,
}: {
  recordId: string;
  caregiverId: string;
  status: string;
  documentRef: string;
  expiresAt: string;
  notes: string;
}) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer list-none font-medium text-teal-700 hover:underline [&::-webkit-details-marker]:hidden">Update</summary>
      <ActionForm action={updateVerificationAction} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="recordId" value={recordId} />
        <input type="hidden" name="caregiverId" value={caregiverId} />
        <SelectField name="status" label="Result" required defaultValue={status} options={opts(VERIFICATION_STATUS_LABELS)} />
        <TextField name="expiresAt" label="Expires on" type="date" defaultValue={expiresAt} />
        <TextField name="documentRef" label="What was checked" defaultValue={documentRef} />
        <TextField name="notes" label="Notes" defaultValue={notes} />
        <div className="sm:col-span-2"><SubmitButton size="sm" variant="secondary">Save</SubmitButton></div>
      </ActionForm>
    </details>
  );
}

export function OverallVerificationForm({ caregiverId, status }: { caregiverId: string; status: string }) {
  return (
    <ActionForm action={setOverallVerificationAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="caregiverId" value={caregiverId} />
      <SelectField name="status" label="Overall verification" required defaultValue={status} options={opts(VERIFICATION_STATUS_LABELS)} className="min-w-48" />
      <SubmitButton size="sm" variant="secondary" className="h-11">Set</SubmitButton>
    </ActionForm>
  );
}

export function AvailabilityForm({ caregiverId }: { caregiverId: string }) {
  return (
    <ActionForm action={addAvailabilityAction} className="grid gap-3 sm:grid-cols-2" resetOnSuccess>
      <input type="hidden" name="caregiverId" value={caregiverId} />
      <SelectField name="kind" label="Type" required defaultValue="UNAVAILABLE" options={opts(AVAILABILITY_KIND_LABELS)} hint="If any availability windows exist, assignments must fall inside one." />
      <TextField name="reason" label="Reason" />
      <TextField name="startDate" label="From" type="date" required />
      <TextField name="endDate" label="To" type="date" hint="Leave empty for open-ended" />
      <div className="sm:col-span-2"><SubmitButton size="sm" variant="secondary">Add</SubmitButton></div>
    </ActionForm>
  );
}

export function CaregiverNoteForm({ caregiverId }: { caregiverId: string }) {
  return (
    <ActionForm action={addCaregiverNoteAction} className="grid gap-3" resetOnSuccess>
      <input type="hidden" name="caregiverId" value={caregiverId} />
      <TextareaField name="body" label="Internal note" required rows={2} />
      <div><SubmitButton size="sm" variant="secondary">Add note</SubmitButton></div>
    </ActionForm>
  );
}
