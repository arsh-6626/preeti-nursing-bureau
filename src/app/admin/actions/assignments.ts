"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/auth/dal";
import { formToObject, success, toActionState, type ActionState } from "@/lib/actions/state";
import {
  cancelAssignment,
  confirmAssignment,
  createAssignment,
  recordAcceptance,
  transitionAssignment,
  updateAssignmentTerms,
} from "@/lib/services/assignments";
import { db } from "@/lib/db";

async function revalidateAssignment(id: string) {
  revalidatePath(`/admin/assignments/${id}`);
  revalidatePath("/admin/assignments");
  const a = await db.assignment.findUnique({ where: { id }, select: { requestId: true, caregiverId: true } });
  if (a) {
    revalidatePath(`/admin/leads/${a.requestId}`);
    revalidatePath(`/admin/caregivers/${a.caregiverId}`);
  }
}

export async function createAssignmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  let id: string;
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    const a = await createAssignment(
      actor,
      { requestId: data.requestId as string, caregiverId: data.caregiverId as string, replacesAssignmentId: (data.replacesAssignmentId as string) || undefined },
      data as never,
    );
    id = a.id;
  } catch (e) {
    return toActionState(e);
  }
  await revalidateAssignment(id);
  redirect(`/admin/assignments/${id}`);
}

export async function updateTermsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const id = String(fd.get("assignmentId"));
    await updateAssignmentTerms(actor, id, formToObject(fd) as never);
    await revalidateAssignment(id);
    return success("Terms updated. Record both acceptances again before confirming.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function acceptanceAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await recordAcceptance(actor, data as never);
    await revalidateAssignment(String(data.assignmentId));
    return success("Acceptance recorded.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function confirmAssignmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("assignmentId"));
  try {
    const actor = await requireActor();
    await confirmAssignment(actor, id);
  } catch (e) {
    return toActionState(e);
  }
  await revalidateAssignment(id);
  redirect(`/admin/assignments/${id}?confirmed=1`);
}

export async function transitionAssignmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await transitionAssignment(actor, data as never);
    await revalidateAssignment(String(data.assignmentId));
    return success("Assignment updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function cancelAssignmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await cancelAssignment(actor, data as never);
    await revalidateAssignment(String(data.assignmentId));
    return success("Assignment cancelled.");
  } catch (e) {
    return toActionState(e);
  }
}
