import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { StaffListPage } from "@/components/admin/staff/staff-list-page";

export const metadata: Metadata = { title: "Caregivers" };

export default async function CaregiversPage({ searchParams }: PageProps<"/admin/caregivers">) {
  const actor = await requirePermissionPage("caregiver:read");
  return <StaffListPage kind="CAREGIVER" actor={actor} sp={await searchParams} />;
}
