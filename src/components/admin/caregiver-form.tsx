"use client";

import Link from "next/link";
import { useRef } from "react";
import { ActionForm, CheckboxGroup, SelectField, SubmitButton, TextareaField, TextField } from "@/components/ui/form";
import { saveCaregiverAction } from "@/app/admin/actions/caregivers";
import { AFFILIATION_LABELS, AVAILABILITY_LABELS, GENDER_LABELS, RATE_PERIOD_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, SHIFT_TYPES } from "@/lib/domain/shift";
import { CARE_TYPE_OPTIONS, EDUCATION_LEVELS, SKILL_OPTIONS, STAFF, WORK_CITIES, WORK_CITY_LABELS, type StaffKind } from "@/lib/domain/staff";
import { ImageUpload } from "./image-upload";

type Defaults = {
  id?: string;
  fullName?: string;
  phone?: string;
  email?: string | null;
  gender?: string;
  serviceCategoryIds?: string[];
  areaIds?: string[];
  workCities?: string[];
  livingAreaIds?: string[];
  skills?: string[];
  careTypes?: string[];
  education?: string | null;
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
  photoSrc?: string | null;
  aadhaarSrc?: string | null;
};

type Option = { value: string; label: string };

const opts = (r: Record<string, string>) => Object.entries(r).map(([value, label]) => ({ value, label }));
const list = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

/** Profile form for a caregiver or a nurse. Each kind is its own record with its own form. */
export function CaregiverForm({
  kind,
  defaults,
  services,
  delhiAreas,
  livingAreas,
  showPay,
  showAadhaar,
}: {
  kind: StaffKind;
  defaults: Defaults;
  services: Option[];
  delhiAreas: Option[];
  livingAreas: Option[];
  showPay: boolean;
  showAadhaar: boolean;
}) {
  const label = STAFF[kind].label.toLowerCase();
  // Skills recorded before the checklist existed stay visible and ticked.
  const skillOptions = list([...SKILL_OPTIONS, ...(defaults.skills ?? []).filter((s) => !(SKILL_OPTIONS as readonly string[]).includes(s))]);
  return (
    <ActionForm action={saveCaregiverAction} className="grid gap-8">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="kind" value={kind} />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Profile</legend>
        <TextField name="fullName" label="Full name" required defaultValue={defaults.fullName} />
        <TextField name="phone" label="Mobile number" type="tel" required defaultValue={defaults.phone} />
        <TextField name="email" label="Email" type="email" defaultValue={defaults.email ?? ""} />
        <SelectField name="gender" label="Gender" required defaultValue={defaults.gender ?? "UNSPECIFIED"} options={opts(GENDER_LABELS)} hint="Used only to honour family preferences." />
        <TextField name="experienceYears" label="Years of experience" type="number" min={0} max={70} required defaultValue={defaults.experienceYears ?? 0} />
        <TextField name="languages" label="Languages" defaultValue={defaults.languages?.join(", ")} hint="Separate with commas" />
        {kind === "CAREGIVER" && (
          <SelectField name="education" label="Education" defaultValue={defaults.education ?? ""} placeholder="Not recorded" options={opts(EDUCATION_LEVELS)} />
        )}
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-3 text-base font-semibold text-navy-900">Photo and ID</legend>
        <ImageUpload name="photo" label="Photo" hint="A clear face photo. Phone photos are resized automatically." currentSrc={defaults.photoSrc} />
        {showAadhaar && (
          <ImageUpload
            name="aadhaar"
            label="Aadhaar card"
            hint="Prefer a masked Aadhaar (only the last 4 digits visible). Only administrators can view it."
            currentSrc={defaults.aadhaarSrc}
          />
        )}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-3 text-base font-semibold text-navy-900">Living address</legend>
        {livingAreas.length > 0 ? (
          <CheckboxGroup name="livingAreaIds" legend="Lives in" hint="Used to find staff living near a family." options={livingAreas} defaultValues={defaults.livingAreaIds} columns={3} />
        ) : (
          <p className="text-sm text-muted">
            No living areas yet. Add them in <Link href="/admin/settings#living" className="font-medium text-teal-700 underline">Settings, Staff living areas</Link>.
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-3 text-base font-semibold text-navy-900">Skills and services</legend>
        <CheckboxGroup name="serviceCategoryIds" legend="Services offered" options={services} defaultValues={defaults.serviceCategoryIds} />
        <CheckboxGroup name="skills" legend="Skills" options={skillOptions} defaultValues={defaults.skills} columns={3} />
        <CheckboxGroup name="careTypes" legend="Can look after" options={list(CARE_TYPE_OPTIONS)} defaultValues={defaults.careTypes} columns={3} />
        <TextareaField
          name="qualifications"
          label={kind === "NURSE" ? "Nursing qualifications" : "Training or certificates"}
          rows={2}
          defaultValue={defaults.qualifications ?? ""}
          hint={kind === "NURSE" ? "e.g. GNM, ANM, B.Sc Nursing, and council registration number. Verification is tracked separately." : "Optional, e.g. GDA course certificate."}
        />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Availability</legend>
        <div className="sm:col-span-2">
          <CheckboxGroup name="supportedShifts" legend={`Shift types this ${label} works`} options={SHIFT_TYPES.map((s) => ({ value: s, label: SHIFT_LABELS[s] }))} defaultValues={defaults.supportedShifts} />
        </div>
        <SelectField name="availabilityStatus" label="Current availability" required defaultValue={defaults.availabilityStatus ?? "AVAILABLE"} options={opts(AVAILABILITY_LABELS)} />
        <div className="sm:col-span-2">
          <WorkLocations delhiAreas={delhiAreas} areaIds={defaults.areaIds} workCities={defaults.workCities} />
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

      <div><SubmitButton>{defaults.id ? "Save changes" : `Create ${label}`}</SubmitButton></div>
    </ActionForm>
  );
}

/** Delhi by locality, outside Delhi by city, with a select-all shortcut. */
function WorkLocations({ delhiAreas, areaIds, workCities }: { delhiAreas: Option[]; areaIds?: string[]; workCities?: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  function toggleAll() {
    const inputs = [...(box.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? [])];
    const allOn = inputs.every((i) => i.checked);
    inputs.forEach((i) => (i.checked = !allOn));
  }
  return (
    <div ref={box} className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-navy-900">Can work in</p>
        <button type="button" onClick={toggleAll} className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm font-medium hover:border-teal-600">
          Select all / clear
        </button>
      </div>
      <CheckboxGroup name="areaIds" legend="Delhi" options={delhiAreas} defaultValues={areaIds} columns={3} />
      <CheckboxGroup name="workCities" legend="Outside Delhi" options={WORK_CITIES.map((c) => ({ value: c, label: WORK_CITY_LABELS[c] }))} defaultValues={workCities} columns={3} />
    </div>
  );
}
