import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { PageHeader } from "@/components/admin/page-header";
import { CaregiverForm } from "@/components/admin/caregiver-form";
import { Notice } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Add caregiver" };

export default async function NewCaregiverPage() {
  const actor = await requirePermissionPage("caregiver:write");
  const [services, areas] = await Promise.all([listActiveServices(), listActiveAreas()]);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Add caregiver" back={{ href: "/admin/caregivers", label: "Caregivers" }} />
      <div className="mb-6"><Notice tone="info">New caregivers start as “Not started” for verification. Record checks on the profile after saving.</Notice></div>
      <CaregiverForm
        defaults={{ supportedShifts: [] }}
        services={services.map((s) => ({ value: s.id, label: s.name }))}
        areas={areas.map((a) => ({ value: a.id, label: `${a.locality}, ${a.city}` }))}
        showPay={can(actor, "caregiver:compensation")}
      />
    </div>
  );
}
