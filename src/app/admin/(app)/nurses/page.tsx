import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { StaffListPage } from "@/components/admin/staff/staff-list-page";

export const metadata: Metadata = { title: "Nurses" };

export default async function NursesPage({ searchParams }: PageProps<"/admin/nurses">) {
  const actor = await requirePermissionPage("caregiver:read");
  return <StaffListPage kind="NURSE" actor={actor} sp={await searchParams} />;
}
