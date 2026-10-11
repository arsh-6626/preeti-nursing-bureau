"use client";

import { useState } from "react";
import { ActionForm, SelectField, SubmitButton, TextareaField, TextField } from "@/components/ui/form";
import {
  addLeadNoteAction,
  completeFollowUpAction,
  logCallAction,
  scheduleFollowUpAction,
  updateLeadMetaAction,
  updateLeadStatusAction,
} from "@/app/admin/actions/leads";
import { CALL_OUTCOME_LABELS, LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/domain/labels";
import type { LeadStatus } from "@/generated/prisma/enums";

const toOptions = (r: Record<string, string>) => Object.entries(r).map(([value, label]) => ({ value, label }));

export function StatusForm({ requestId, allowed }: { requestId: string; allowed: LeadStatus[] }) {
  const [to, setTo] = useState<string>("");
  if (allowed.length === 0) return <p className="text-sm text-muted">This lead is closed. No further status changes are possible.</p>;
  const closing = to === "CANCELLED" || to === "UNFULFILLED";
  return (
    <ActionForm action={updateLeadStatusAction} className="grid gap-3" resetOnSuccess onSuccess={() => setTo("")}>
      <input type="hidden" name="requestId" value={requestId} />
      <SelectField
        name="toStatus"
        label="Move to"
        required
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="Choose a status"
        options={allowed.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))}
      />
      {closing && <TextField name="closedReason" label="Reason" required placeholder="Why is this lead closing?" />}
      <TextareaField name="note" label="Note" rows={2} />
      <div><SubmitButton size="sm">Update status</SubmitButton></div>
    </ActionForm>
  );
}

export function LeadMetaForm({
  requestId,
  priority,
  source,
  assignedToId,
  team,
  canAssign,
}: {
  requestId: string;
  priority: string;
  source: string;
  assignedToId: string | null;
  team: { id: string; name: string }[];
  canAssign: boolean;
}) {
  return (
    <ActionForm action={updateLeadMetaAction} className="grid gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <SelectField name="priority" label="Priority" required defaultValue={priority} options={toOptions(PRIORITY_LABELS)} />
      <SelectField name="source" label="Original source" required defaultValue={source} options={toOptions(LEAD_SOURCE_LABELS)} />
      {canAssign ? (
        <SelectField name="assignedToId" label="Assigned to" defaultValue={assignedToId ?? ""} placeholder="Unassigned" options={team.map((t) => ({ value: t.id, label: t.name }))} />
      ) : (
        <input type="hidden" name="assignedToId" value={assignedToId ?? ""} />
      )}
      <div><SubmitButton size="sm" variant="secondary">Save</SubmitButton></div>
    </ActionForm>
  );
}

export function CallForm({ requestId }: { requestId: string }) {
  return (
    <ActionForm action={logCallAction} className="grid gap-3" resetOnSuccess>
      <input type="hidden" name="requestId" value={requestId} />
      <SelectField name="outcome" label="Call outcome" required defaultValue="REACHED" options={toOptions(CALL_OUTCOME_LABELS)} />
      <TextField name="notes" label="Notes" />
      <div><SubmitButton size="sm" variant="secondary">Record call</SubmitButton></div>
    </ActionForm>
  );
}

export function NoteForm({ requestId }: { requestId: string }) {
  return (
    <ActionForm action={addLeadNoteAction} className="grid gap-3" resetOnSuccess>
      <input type="hidden" name="requestId" value={requestId} />
      <TextareaField name="body" label="Private note" required rows={3} hint="Visible to the bureau team only. Never shown to customers." />
      <div><SubmitButton size="sm" variant="secondary">Add note</SubmitButton></div>
    </ActionForm>
  );
}

export function FollowUpForm({ requestId, defaultDue, team, canAssign, selfId }: { requestId: string; defaultDue: string; team: { id: string; name: string }[]; canAssign: boolean; selfId: string }) {
  return (
    <ActionForm action={scheduleFollowUpAction} className="grid gap-3" resetOnSuccess>
      <input type="hidden" name="requestId" value={requestId} />
      <TextField name="dueAt" label="Due (India time)" type="datetime-local" required defaultValue={defaultDue} />
      {canAssign ? (
        <SelectField name="assignedToId" label="For" defaultValue={selfId} options={team.map((t) => ({ value: t.id, label: t.name }))} />
      ) : (
        <input type="hidden" name="assignedToId" value={selfId} />
      )}
      <TextField name="notes" label="What to follow up on" />
      <div><SubmitButton size="sm" variant="secondary">Schedule follow-up</SubmitButton></div>
    </ActionForm>
  );
}

export function CompleteFollowUpForm({ followUpId, requestId }: { followUpId: string; requestId: string }) {
  return (
    <ActionForm action={completeFollowUpAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="followUpId" value={followUpId} />
      <input type="hidden" name="requestId" value={requestId} />
      <SelectField name="outcome" label="Outcome" required defaultValue="REACHED" options={toOptions(CALL_OUTCOME_LABELS)} className="min-w-40" />
      <TextField name="notes" label="Notes" className="min-w-40 flex-1" />
      <SubmitButton size="sm" variant="secondary" className="h-11">Done</SubmitButton>
    </ActionForm>
  );
}
