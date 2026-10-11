"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/auth/dal";
import { formToObject, success, toActionState, type ActionState } from "@/lib/actions/state";
import { createCustomer, updateCustomer } from "@/lib/services/customers";

export async function saveCustomerAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("id") ?? "");
  let newId: string | null = null;
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    if (id) await updateCustomer(actor, id, data as never);
    else newId = (await createCustomer(actor, data as never)).id;
  } catch (e) {
    return toActionState(e);
  }
  revalidatePath("/admin/customers");
  if (newId) redirect(`/admin/customers/${newId}`);
  revalidatePath(`/admin/customers/${id}`);
  return success("Customer saved.");
}
