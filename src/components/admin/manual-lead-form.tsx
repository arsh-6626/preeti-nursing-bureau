"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createManualLeadAction } from "@/app/admin/actions/leads";
import { SHIFT_LABELS, SHIFT_TYPES } from "@/lib/domain/shift";
import {
  ARRANGEMENT_LABELS,
  CONTACT_METHOD_LABELS,
  DURATION_UNIT_LABELS,
  GENDER_PREF_LABELS,
  LEAD_SOURCE_LABELS,
  MOBILITY_LABELS,
  SHIFT_TIMING_LABELS,
} from "@/lib/domain/labels";
import { buttonClass } from "@/components/ui/button";

type Option = { value: string; label: string };
type Area = { id: string; city: string; locality: string; pincode: string | null };

const control = "block w-full rounded-[var(--radius-control)] border border-line-strong bg-paper px-3 text-[15px] text-navy-950 focus:border-teal-600 aria-invalid:border-rose-700";

export function ManualLeadForm({
  services,
  areas,
  defaults,
}: {
  services: Option[];
  areas: Area[];
  defaults: { customerName?: string; phone?: string; inquiryId?: string; preferredContact?: string };
}) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { register, getValues, watch, setValue } = useForm({
    defaultValues: {
      source: "PHONE",
      serviceCategoryId: "",
      otherServiceText: "",
      mobility: "NEEDS_ASSISTANCE",
      careDescription: "",
      assistanceType: "",
      preferredGender: "NO_PREFERENCE",
      nursingSkillsRequired: "",
      additionalRequirements: "",
      shiftType: "",
      shiftTiming: "NO_PREFERENCE",
      startDate: "",
      durationValue: "1",
      durationUnit: "WEEKS",
      arrangementType: "TEMPORARY",
      serviceAreaId: "",
      city: "",
      locality: "",
      pincode: "",
      address: "",
      customerName: defaults.customerName ?? "",
      phone: defaults.phone ?? "",
      email: "",
      relationship: "",
      preferredContact: defaults.preferredContact ?? "PHONE",
      contactConsent: false,
    },
  });
  const city = watch("city");
  const cities = [...new Set(areas.map((a) => a.city))];

  const field = (name: string, label: string, node: React.ReactNode, optional = false, wide = false) => (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={name} className="text-sm font-semibold text-navy-900">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {node}
      {errors[name] && <p className="text-xs font-medium text-rose-700">{errors[name]}</p>}
    </div>
  );
  const opts = (r: Record<string, string>) => Object.entries(r).map(([v, l]) => <option key={v} value={v}>{l}</option>);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        start(async () => {
          const res = await createManualLeadAction({ ...getValues(), idempotencyKey, inquiryId: defaults.inquiryId ?? "" });
          if (res && !res.ok) {
            setErrors(res.fieldErrors ?? {});
            setMessage(res.message ?? "Please check the form.");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        });
      }}
      className="grid gap-8"
    >
      {message && <p role="alert" className="rounded-[var(--radius-control)] border border-rose-700/20 bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Customer</legend>
        {field("customerName", "Name", <input id="customerName" className={`${control} h-11`} aria-invalid={!!errors.customerName} {...register("customerName")} />)}
        {field("phone", "Mobile number", <input id="phone" type="tel" className={`${control} tabular h-11`} aria-invalid={!!errors.phone} {...register("phone")} />)}
        {field("email", "Email", <input id="email" type="email" className={`${control} h-11`} {...register("email")} />, true)}
        {field("relationship", "Relationship to patient", <input id="relationship" className={`${control} h-11`} {...register("relationship")} />, true)}
        {field("preferredContact", "Preferred contact", <select id="preferredContact" className={`${control} h-11`} {...register("preferredContact")}>{opts(CONTACT_METHOD_LABELS)}</select>)}
        {field("source", "Lead source", <select id="source" className={`${control} h-11`} {...register("source")}>{opts(LEAD_SOURCE_LABELS)}</select>)}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Care required</legend>
        {field("serviceCategoryId", "Service", <select id="serviceCategoryId" className={`${control} h-11`} aria-invalid={!!errors.serviceCategoryId} {...register("serviceCategoryId")}><option value="">Other (describe below)</option>{services.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>)}
        {field("otherServiceText", "Other service", <input id="otherServiceText" className={`${control} h-11`} {...register("otherServiceText")} />, true)}
        {field("mobility", "Mobility", <select id="mobility" className={`${control} h-11`} {...register("mobility")}>{opts(MOBILITY_LABELS)}</select>)}
        {field("preferredGender", "Caregiver preference", <select id="preferredGender" className={`${control} h-11`} {...register("preferredGender")}>{opts(GENDER_PREF_LABELS)}</select>)}
        {field("careDescription", "Care needed", <textarea id="careDescription" rows={3} className={`${control} py-2`} aria-invalid={!!errors.careDescription} {...register("careDescription")} />, false, true)}
        {field("nursingSkillsRequired", "Nursing tasks", <input id="nursingSkillsRequired" className={`${control} h-11`} {...register("nursingSkillsRequired")} />, true)}
        {field("additionalRequirements", "Other requirements", <input id="additionalRequirements" className={`${control} h-11`} {...register("additionalRequirements")} />, true)}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Shift and dates</legend>
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-navy-900">Shift</p>
          <div className="mt-1.5 flex gap-2">
            {SHIFT_TYPES.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-line-strong px-4 py-2.5 text-sm font-semibold has-checked:border-teal-600 has-checked:bg-teal-50">
                <input type="radio" value={s} className="accent-teal-600" {...register("shiftType")} /> {SHIFT_LABELS[s]}
              </label>
            ))}
          </div>
          {errors.shiftType && <p className="mt-1 text-xs font-medium text-rose-700">{errors.shiftType}</p>}
        </div>
        {field("shiftTiming", "Day / night (12-hour only)", <select id="shiftTiming" className={`${control} h-11`} {...register("shiftTiming")}>{opts(SHIFT_TIMING_LABELS)}</select>)}
        {field("startDate", "Start date", <input id="startDate" type="date" className={`${control} h-11`} aria-invalid={!!errors.startDate} {...register("startDate")} />)}
        <div className="flex gap-2">
          {field("durationValue", "Duration", <input id="durationValue" type="number" min={1} max={365} className={`${control} tabular h-11 w-24`} {...register("durationValue")} />)}
          {field("durationUnit", "Unit", <select id="durationUnit" className={`${control} h-11`} {...register("durationUnit")}>{opts(DURATION_UNIT_LABELS)}</select>)}
        </div>
        {field("arrangementType", "Arrangement", <select id="arrangementType" className={`${control} h-11`} {...register("arrangementType")}>{opts(ARRANGEMENT_LABELS)}</select>)}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-navy-900">Location</legend>
        {field("city", "City", <select id="city" className={`${control} h-11`} aria-invalid={!!errors.city} {...register("city", { onChange: () => { setValue("serviceAreaId", ""); } })}><option value="">Choose</option>{cities.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field(
          "serviceAreaId",
          "Listed locality",
          <select
            id="serviceAreaId"
            className={`${control} h-11`}
            {...register("serviceAreaId", {
              onChange: (e) => {
                const a = areas.find((x) => x.id === e.target.value);
                if (a) {
                  setValue("locality", a.locality);
                  if (a.pincode) setValue("pincode", a.pincode);
                }
              },
            })}
          >
            <option value="">Not listed</option>
            {areas.filter((a) => a.city === city).map((a) => <option key={a.id} value={a.id}>{a.locality}</option>)}
          </select>,
          true,
        )}
        {field("locality", "Locality", <input id="locality" className={`${control} h-11`} aria-invalid={!!errors.locality} {...register("locality")} />)}
        {field("pincode", "Pincode", <input id="pincode" inputMode="numeric" className={`${control} tabular h-11`} aria-invalid={!!errors.pincode} {...register("pincode")} />)}
        {field("address", "Address", <textarea id="address" rows={2} className={`${control} py-2`} {...register("address")} />, true, true)}
      </fieldset>

      <div>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" className="mt-0.5 size-4.5 accent-teal-600" {...register("contactConsent")} />
          The customer agreed to be contacted about this request.
        </label>
        {errors.contactConsent && <p className="mt-1 text-xs font-medium text-rose-700">{errors.contactConsent}</p>}
      </div>

      <div>
        <button type="submit" disabled={pending} className={buttonClass("primary", "md")}>
          {pending ? "Saving…" : "Create lead"}
        </button>
      </div>
    </form>
  );
}
