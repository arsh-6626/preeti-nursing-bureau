import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can, NotFoundError } from "@/lib/auth/permissions";
import { getCaregiverDetail } from "@/lib/services/caregivers";
import { listAllAreas, listActiveServices } from "@/lib/services/settings";
import { fromDbShift } from "@/lib/domain/shift";
import { moneyString } from "@/lib/domain/money";
import { PageHeader } from "@/components/admin/page-header";
import { CaregiverForm } from "@/components/admin/caregiver-form";

export const metadata: Metadata = { title: "Edit caregiver" };

export default async function EditCaregiverPage({ params }: PageProps<"/admin/caregivers/[id]/edit">) {
  const actor = await requirePermissionPage("caregiver:write");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getCaregiverDetail(actor, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const [services, areas] = await Promise.all([listActiveServices(), listAllAreas(actor)]);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${c.fullName}`} back={{ href: `/admin/caregivers/${c.id}`, label: c.code }} />
      <CaregiverForm
        defaults={{
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          photoUrl: c.photoUrl,
          gender: c.gender,
          serviceCategoryIds: c.services.map((s) => s.serviceCategoryId),
          areaIds: c.areas.map((a) => a.serviceAreaId),
          skills: c.skills,
          qualifications: c.qualifications,
          experienceYears: c.experienceYears,
          languages: c.languages,
          availabilityStatus: c.availabilityStatus,
          supportedShifts: c.supportedShifts.map(fromDbShift),
          payout12h: "payout12h" in c && c.payout12h ? moneyString(c.payout12h) : "",
          payout24h: "payout24h" in c && c.payout24h ? moneyString(c.payout24h) : "",
          payoutPeriod: "payoutPeriod" in c ? c.payoutPeriod : undefined,
          affiliation: c.affiliation,
          agencyName: c.agencyName,
        }}
        services={[
          ...services.map((s) => ({ value: s.id, label: s.name })),
          ...c.services
            .filter((x) => !services.some((s) => s.id === x.serviceCategoryId))
            .map((x) => ({ value: x.serviceCategoryId, label: `${x.serviceCategory.name} (inactive)` })),
        ]}
        areas={areas.filter((a) => a.isActive || c.areas.some((x) => x.serviceAreaId === a.id)).map((a) => ({ value: a.id, label: `${a.locality}, ${a.city}` }))}
        showPay={can(actor, "caregiver:compensation")}
      />
    </div>
  );
}
