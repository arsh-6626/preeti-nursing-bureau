"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/auth/dal";
import { formToObject, success, toActionState, type ActionState } from "@/lib/actions/state";
import { addAdjustment, correctCommission, recordPayment, reversePayment } from "@/lib/services/finance";
import { formatINR } from "@/lib/domain/money";

function revalidate(assignmentId: string) {
  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function recordPaymentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await recordPayment(actor, data as never);
    revalidate(String(data.assignmentId));
    return success("Payment recorded.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function reversePaymentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await reversePayment(actor, { paymentId: String(fd.get("paymentId")), reason: String(fd.get("reason") ?? "") });
    revalidate(String(fd.get("assignmentId")));
    return success("Reversal entry recorded.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function addAdjustmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await addAdjustment(actor, data as never);
    revalidate(String(data.assignmentId));
    return success("Adjustment recorded.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function correctCommissionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const id = String(fd.get("assignmentId"));
    const diff = await correctCommission(actor, id);
    revalidate(id);
    return success(`Commission corrected by ${formatINR(diff)}.`);
  } catch (e) {
    return toActionState(e);
  }
}
