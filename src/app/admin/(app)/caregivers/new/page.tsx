import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { NewStaffPage } from "@/components/admin/staff/new-staff-page";

export const metadata: Metadata = { title: "Add caregiver" };

export default async function NewCaregiverPage() {
  const actor = await requirePermissionPage("caregiver:write");
  return <NewStaffPage kind="CAREGIVER" actor={actor} />;
}
