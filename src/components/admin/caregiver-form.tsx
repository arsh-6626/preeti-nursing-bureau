"use client";

import { ActionForm, CheckboxGroup, SelectField, SubmitButton, TextareaField, TextField } from "@/components/ui/form";
import { saveCaregiverAction } from "@/app/admin/actions/caregivers";
import { AFFILIATION_LABELS, AVAILABILITY_LABELS, GENDER_LABELS, RATE_PERIOD_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, SHIFT_TYPES } from "@/lib/domain/shift";

type Defaults = {
  id?: string;
  fullName?: string;
  phone?: string;
  email?: string | null;
  photoUrl?: string | null;
  gender?: string;
  serviceCategoryIds?: string[];
  areaIds?: string[];
  skills?: string[];
  qualifications?: string | null;
  experienceYears?: number;
  languages?: string[];
  availabilityStatus?: string;
  supportedShifts?: string[];
  payout12h?: string;
  payout24h?: string;
  payoutPeriod?: string;
  affiliation?: string;
  agencyName?: string | null;
};

const opts = (r: Record<string, string>) => Object.entries(r).map(([value, label]) => ({ value, label }));

export function CaregiverForm({
  defaults,
  services,
  areas,
  showPay,
}: {
  defaults: Defaults;
  services: { value: string; label: string }[];
  areas: { value: string; label: string }[];
  showPay: boolean;
}) {
  return (
    <ActionForm action={saveCaregiverAction} className="grid gap-8">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Profile</legend>
        <TextField name="fullName" label="Full name" required defaultValue={defaults.fullName} />
        <TextField name="phone" label="Mobile number" type="tel" required defaultValue={defaults.phone} />
        <TextField name="email" label="Email" type="email" defaultValue={defaults.email ?? ""} />
        <SelectField name="gender" label="Gender" required defaultValue={defaults.gender ?? "UNSPECIFIED"} options={opts(GENDER_LABELS)} hint="Used only to honour family preferences." />
        <TextField name="experienceYears" label="Years of experience" type="number" min={0} max={70} required defaultValue={defaults.experienceYears ?? 0} />
        <TextField name="languages" label="Languages" defaultValue={defaults.languages?.join(", ")} hint="Separate with commas" />
        <TextField name="photoUrl" label="Photo link" defaultValue={defaults.photoUrl ?? ""} hint="https:// link to a photo the caregiver agreed to share" className="sm:col-span-2" />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-3 text-base font-semibold text-navy-900">Skills and services</legend>
        <CheckboxGroup name="serviceCategoryIds" legend="Services offered" options={services} defaultValues={defaults.serviceCategoryIds} />
        <TextField name="skills" label="Skills" defaultValue={defaults.skills?.join(", ")} hint="Separate with commas, e.g. Feeding, Mobility support, Injections" />
        <TextareaField name="qualifications" label="Qualifications" rows={2} defaultValue={defaults.qualifications ?? ""} hint="Record nursing qualifications here (e.g. GNM, ANM, B.Sc Nursing). Verification is tracked separately." />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Availability</legend>
        <div className="sm:col-span-2">
          <CheckboxGroup name="supportedShifts" legend="Shift types this caregiver works" options={SHIFT_TYPES.map((s) => ({ value: s, label: SHIFT_LABELS[s] }))} defaultValues={defaults.supportedShifts} />
        </div>
        <SelectField name="availabilityStatus" label="Current availability" required defaultValue={defaults.availabilityStatus ?? "AVAILABLE"} options={opts(AVAILABILITY_LABELS)} />
        <div className="sm:col-span-2">
          <CheckboxGroup name="areaIds" legend="Preferred locations" options={areas} defaultValues={defaults.areaIds} columns={3} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Affiliation{showPay && " and pay"}</legend>
        <SelectField name="affiliation" label="Affiliation" required defaultValue={defaults.affiliation ?? "INDEPENDENT"} options={opts(AFFILIATION_LABELS)} />
        <TextField name="agencyName" label="Agency name" defaultValue={defaults.agencyName ?? ""} />
        {showPay && (
          <>
            <TextField name="payout12h" label="Agreed payout, 12-hour (₹)" inputMode="decimal" defaultValue={defaults.payout12h} />
            <TextField name="payout24h" label="Agreed payout, 24-hour (₹)" inputMode="decimal" defaultValue={defaults.payout24h} />
            <SelectField name="payoutPeriod" label="Payout is" required defaultValue={defaults.payoutPeriod ?? "PER_DAY"} options={opts(RATE_PERIOD_LABELS)} />
          </>
        )}
      </fieldset>

      <div><SubmitButton>{defaults.id ? "Save changes" : "Create caregiver"}</SubmitButton></div>
    </ActionForm>
  );
}
