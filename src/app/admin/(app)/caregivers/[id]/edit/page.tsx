import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can, NotFoundError } from "@/lib/auth/permissions";
import { getCaregiverDetail } from "@/lib/services/caregivers";
import { fromDbShift } from "@/lib/domain/shift";
import { moneyString } from "@/lib/domain/money";
import { staffFileUrl } from "@/lib/staff-files";
import { PageHeader } from "@/components/admin/page-header";
import { CaregiverForm } from "@/components/admin/caregiver-form";
import { staffFormOptions } from "@/components/admin/staff/staff-form-options";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditCaregiverPage({ params }: PageProps<"/admin/caregivers/[id]/edit">) {
  const actor = await requirePermissionPage("caregiver:write");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getCaregiverDetail(actor, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const areaIds = c.areas.map((a) => a.serviceAreaId);
  const livingAreaIds = c.livingAreas.map((l) => l.livingAreaId);
  const options = await staffFormOptions(actor, c.kind, { areaIds, livingAreaIds });
  const shownServiceIds = new Set(options.services.map((s) => s.value));
  const photo = c.files.find((f) => f.kind === "PHOTO");
  const aadhaar = c.files.find((f) => f.kind === "AADHAAR");
  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${c.fullName}`} back={{ href: `/admin/caregivers/${c.id}`, label: c.code }} />
      <CaregiverForm
        kind={c.kind}
        defaults={{
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          gender: c.gender,
          serviceCategoryIds: c.services.map((s) => s.serviceCategoryId),
          areaIds,
          workCities: c.workCities,
          livingAreaIds,
          skills: c.skills,
          careTypes: c.careTypes,
          education: c.education,
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
          photoSrc: photo ? staffFileUrl(c.id, "photo", photo.createdAt) : null,
          aadhaarSrc: aadhaar ? staffFileUrl(c.id, "aadhaar", aadhaar.createdAt) : null,
        }}
        {...options}
        // Inactive services already linked stay visible so saving does not drop them.
        services={[
          ...options.services,
          ...c.services
            .filter((x) => !shownServiceIds.has(x.serviceCategoryId) && (c.kind === "NURSE" || !["male-patient-attendant", "female-patient-attendant"].includes(x.serviceCategory.slug)))
            .map((x) => ({ value: x.serviceCategoryId, label: `${x.serviceCategory.name} (inactive)` })),
        ]}
        showPay={can(actor, "caregiver:compensation")}
        showAadhaar={can(actor, "caregiver:verification")}
      />
    </div>
  );
}
