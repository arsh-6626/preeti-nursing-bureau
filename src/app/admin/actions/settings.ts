"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/auth/dal";
import { formToObject, success, toActionState, type ActionState } from "@/lib/actions/state";
import {
  createServiceArea,
  moveService,
  saveContentPage,
  saveServiceCategory,
  setAreaActive,
  setServiceActive,
  updateBusinessSettings,
  updateCommissionPolicy,
  upsertPricingRule,
} from "@/lib/services/settings";
import { createUser, setUserActive, resetUserPassword } from "@/lib/services/users";

function revalidatePublic() {
  revalidatePath("/", "layout");
}

export async function saveBusinessSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await updateBusinessSettings(actor, formToObject(fd) as never);
    revalidatePublic();
    return success("Business settings saved.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function saveCommissionPolicyAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await updateCommissionPolicy(actor, formToObject(fd) as never);
    revalidatePath("/admin/settings");
    return success("Commission policy saved. It applies to new assignments; existing ones keep their agreed terms.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function saveServiceAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  let id = String(fd.get("id") ?? "") || null;
  try {
    const actor = await requireActor();
    const saved = await saveServiceCategory(actor, id, formToObject(fd) as never);
    id = saved.id;
  } catch (e) {
    return toActionState(e);
  }
  revalidatePublic();
  redirect(`/admin/settings/services/${id}?saved=1`);
}

export async function toggleServiceAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await setServiceActive(actor, String(fd.get("id")), fd.get("active") === "1");
    revalidatePublic();
    return success("Service updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function moveServiceAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await moveService(actor, String(fd.get("id")), fd.get("direction") === "up" ? "up" : "down");
    revalidatePublic();
    return success();
  } catch (e) {
    return toActionState(e);
  }
}

export async function createAreaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await createServiceArea(actor, formToObject(fd) as never);
    revalidatePublic();
    return success("Service area added.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function toggleAreaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await setAreaActive(actor, String(fd.get("id")), fd.get("active") === "1");
    revalidatePublic();
    return success("Service area updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function savePricingAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await upsertPricingRule(actor, formToObject(fd) as never);
    revalidatePath("/admin/settings");
    return success("Pricing saved.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function saveContentPageAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await saveContentPage(actor, formToObject(fd) as never);
    revalidatePublic();
    return success("Page saved.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function createUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await createUser(actor, formToObject(fd) as never);
    revalidatePath("/admin/users");
    return success("Account created. Share the temporary password securely and ask them to change it.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function setUserActiveAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await setUserActive(actor, String(fd.get("userId")), fd.get("active") === "1");
    revalidatePath("/admin/users");
    return success("Account updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function resetPasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await resetUserPassword(actor, String(fd.get("userId")), String(fd.get("password") ?? ""));
    revalidatePath("/admin/users");
    return success("Password reset. The user's sessions were signed out.");
  } catch (e) {
    return toActionState(e);
  }
}
