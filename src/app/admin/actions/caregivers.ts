"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/auth/dal";
import { formToObject, success, toActionState, type ActionState } from "@/lib/actions/state";
import {
  addAvailability,
  addCaregiverNote,
  addVerificationRecord,
  createCaregiver,
  removeAvailability,
  prepareStaffFiles,
  storeStaffFiles,
  setCaregiverArchived,
  setOverallVerification,
  updateCaregiver,
  updateVerificationRecord,
} from "@/lib/services/caregivers";

const ARRAYS = ["serviceCategoryIds", "areaIds", "supportedShifts", "workCities", "livingAreaIds", "skills", "careTypes"];

/** Takes an uploaded image out of the form data (an empty input arrives as a 0-byte file). */
function takeFile(fd: FormData, name: string): File | null {
  const v = fd.get(name);
  fd.delete(name);
  return v instanceof File && v.size > 0 ? v : null;
}

export async function saveCaregiverAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  let id = String(fd.get("id") ?? "");
  try {
    const actor = await requireActor();
    // Images are checked first so a rejected file never leaves a half-saved profile.
    const files = await prepareStaffFiles(actor, { PHOTO: takeFile(fd, "photo"), AADHAAR: takeFile(fd, "aadhaar") });
    const data = formToObject(fd, ARRAYS);
    if (id) await updateCaregiver(actor, id, data as never);
    else id = (await createCaregiver(actor, data as never)).id;
    await storeStaffFiles(actor, id, files);
  } catch (e) {
    return toActionState(e);
  }
  revalidatePath("/admin/nurses");
  revalidatePath("/admin/caregivers");
  revalidatePath(`/admin/caregivers/${id}`);
  redirect(`/admin/caregivers/${id}?saved=1`);
}

export async function archiveCaregiverAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const id = String(fd.get("caregiverId"));
    await setCaregiverArchived(actor, id, fd.get("archive") === "1");
    revalidatePath(`/admin/caregivers/${id}`);
    revalidatePath("/admin/caregivers");
    return success(fd.get("archive") === "1" ? "Caregiver archived. History is kept." : "Caregiver restored.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function addVerificationAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await addVerificationRecord(actor, data as never);
    revalidatePath(`/admin/caregivers/${String(data.caregiverId)}`);
    return success("Verification record added.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function updateVerificationAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await updateVerificationRecord(actor, data as never);
    revalidatePath(`/admin/caregivers/${String(fd.get("caregiverId"))}`);
    return success("Verification record updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function setOverallVerificationAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await setOverallVerification(actor, data as never);
    revalidatePath(`/admin/caregivers/${String(data.caregiverId)}`);
    return success("Overall verification status updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function addAvailabilityAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const data = formToObject(fd);
    await addAvailability(actor, data as never);
    revalidatePath(`/admin/caregivers/${String(data.caregiverId)}`);
    return success("Availability updated.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function removeAvailabilityAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await removeAvailability(actor, String(fd.get("availabilityId")));
    revalidatePath(`/admin/caregivers/${String(fd.get("caregiverId"))}`);
    return success("Entry removed.");
  } catch (e) {
    return toActionState(e);
  }
}

export async function addCaregiverNoteAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const id = String(fd.get("caregiverId"));
    await addCaregiverNote(actor, id, { body: String(fd.get("body") ?? "") });
    revalidatePath(`/admin/caregivers/${id}`);
    return success("Note added.");
  } catch (e) {
    return toActionState(e);
  }
}
