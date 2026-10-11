"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/auth/dal";
import { formToObject, success, toActionState, failure, type ActionState } from "@/lib/actions/state";
import {
  addLeadNote,
  cancelFollowUp,
  completeFollowUp,
  logCall,
  scheduleFollowUp,
  updateLeadMeta,
  updateLeadStatus,
} from "@/lib/services/leads";
import { createManualLead } from "@/lib/services/requests";
import { markInquiryHandled } from "@/lib/services/inquiries";

const leadPath = (id: unknown) => `/admin/leads/${String(id)}`;

export async function updateLeadStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await updateLeadStatus(actor, data as never);
    revalidatePath(leadPath(data.requestId));
    return success("Status updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function updateLeadMetaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await updateLeadMeta(actor, data as never);
    revalidatePath(leadPath(data.requestId));
    return success("Lead details saved.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function addLeadNoteAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const requestId = String(fd.get("requestId"));
    await addLeadNote(actor, requestId, { body: String(fd.get("body") ?? "") });
    revalidatePath(leadPath(requestId));
    return success("Note added.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function logCallAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await logCall(actor, data as never);
    revalidatePath(leadPath(data.requestId));
    return success("Call recorded.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function scheduleFollowUpAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    // datetime-local values are in India time; store as an absolute instant.
    if (typeof data.dueAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.dueAt)) data.dueAt = `${data.dueAt}:00+05:30`;
    await scheduleFollowUp(actor, data as never);
    revalidatePath(leadPath(data.requestId));
    revalidatePath("/admin/follow-ups");
    return success("Follow-up scheduled.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function completeFollowUpAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await completeFollowUp(actor, data as never);
    revalidatePath("/admin/follow-ups");
    if (data.requestId) revalidatePath(leadPath(data.requestId));
    return success("Follow-up completed.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function cancelFollowUpAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await cancelFollowUp(actor, String(fd.get("followUpId")));
    revalidatePath("/admin/follow-ups");
    if (fd.get("requestId")) revalidatePath(leadPath(fd.get("requestId")));
    return success("Follow-up cancelled.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function createManualLeadAction(payload: Record<string, unknown>): Promise<ActionState> {
  let created: { id: string } | null = null;
  try {
    const actor = await requireActor();
    const { inquiryId: _inquiryId, ...leadPayload } = payload;
    void _inquiryId;
    const result = await createManualLead(actor, leadPayload);
    if (!result.ok) return failure(result.error, result.fieldErrors);
    if (typeof payload.inquiryId === "string" && payload.inquiryId) {
      await markInquiryHandled(actor, payload.inquiryId).catch(() => undefined);
    }
    created = { id: result.id };
  } catch (e) {
    return toActionState(e);
  }
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${created.id}`);
}

export async function markInquiryHandledAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await markInquiryHandled(actor, String(fd.get("inquiryId")));
    revalidatePath("/admin/leads");
    return success("Marked as handled.");
  } catch (e) {
    return toActionState(e);
  }
}
