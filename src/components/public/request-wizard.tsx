"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { careRequestSchema, type CareRequestInput, type CareRequest } from "@/lib/validation/request";
import { SHIFT_DESCRIPTIONS, SHIFT_LABELS, SHIFT_TYPES } from "@/lib/domain/shift";
import {
  ARRANGEMENT_LABELS,
  CONTACT_METHOD_LABELS,
  DURATION_UNIT_LABELS,
  GENDER_PREF_LABELS,
  MOBILITY_LABELS,
  SHIFT_TIMING_LABELS,
} from "@/lib/domain/labels";
import { submitCareRequestAction } from "@/app/(public)/actions";
import { buttonClass } from "@/components/ui/button";

type Service = { id: string; name: string; slug: string; summary: string; isNursing: boolean };
type Area = { id: string; city: string; locality: string; pincode: string | null };

type Props = {
  services: Service[];
  areas: Area[];
  allowOther: boolean;
  consentText: string;
  initialServiceId?: string;
  initialShift?: "12_HOURS" | "24_HOURS";
  minDate: string;
  maxDate: string;
  contact: React.ReactNode;
};

const STEPS = [
  { key: "service", title: "Service", fields: ["serviceCategoryId", "otherServiceText"] },
  { key: "care", title: "Care needs", fields: ["assistanceType", "mobility", "careDescription", "preferredGender", "nursingSkillsRequired", "additionalRequirements"] },
  { key: "schedule", title: "Shift and dates", fields: ["shiftType", "shiftTiming", "startDate", "durationValue", "durationUnit", "arrangementType"] },
  { key: "location", title: "Location", fields: ["serviceAreaId", "city", "locality", "pincode", "address"] },
  { key: "contact", title: "Your details", fields: ["customerName", "phone", "email", "relationship", "preferredContact", "contactConsent"] },
  { key: "review", title: "Review", fields: [] },
] as const satisfies readonly { key: string; title: string; fields: readonly FieldPath<CareRequestInput>[] }[];

const inputClass =
  "block w-full rounded-[14px] border border-text/20 bg-white px-4 text-base text-text placeholder:text-text-2/70 hover:border-text/35 focus:border-field focus:outline-2 focus:outline-offset-0 focus:outline-field/25 aria-invalid:border-rose-700";

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-[15px] font-semibold text-navy-900">
      {children}
      {optional && <span className="font-normal text-muted"> (optional)</span>}
    </label>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-rose-700">
      {message}
    </p>
  );
}

function ChoiceCard({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`flex h-full cursor-pointer flex-col rounded-2xl border px-4 py-4 transition-[background-color,border-color,box-shadow] duration-200 ${checked ? "border-field bg-field-soft/60 shadow-[inset_0_0_0_1px_var(--color-field)]" : "border-text/15 bg-white hover:border-text/40"}`}
    >
      {children}
    </span>
  );
}

export function RequestWizard(props: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<CareRequestInput, unknown, CareRequest>({
    resolver: zodResolver(careRequestSchema),
    // Validate when the visitor presses Continue, and clear an error as soon as
    // its field changes. Validating on blur would move the layout under the
    // pointer just as the visitor reaches for the Continue button.
    mode: "onSubmit",
    defaultValues: {
      serviceCategoryId: props.initialServiceId ?? "",
      otherServiceText: "",
      assistanceType: "",
      careDescription: "",
      preferredGender: "NO_PREFERENCE",
      nursingSkillsRequired: "",
      additionalRequirements: "",
      shiftType: props.initialShift,
      shiftTiming: "NO_PREFERENCE",
      startDate: "",
      durationValue: 1,
      durationUnit: "WEEKS",
      serviceAreaId: "",
      city: "",
      locality: "",
      pincode: "",
      address: "",
      customerName: "",
      phone: "",
      email: "",
      relationship: "",
      preferredContact: "PHONE",
      contactConsent: false as unknown as true,
      idempotencyKey,
      website: "",
    },
  });
  const { register, watch, setValue, trigger, formState, getValues, setError, clearErrors } = form;
  useEffect(() => {
    const sub = watch((_value, { name }) => {
      if (name) clearErrors(name);
    });
    return () => sub.unsubscribe();
  }, [watch, clearErrors]);
  const errors = formState.errors;
  const values = watch();

  const cities = useMemo(() => [...new Set(props.areas.map((a) => a.city))], [props.areas]);
  const cityAreas = props.areas.filter((a) => a.city === values.city);
  const selectedService = props.services.find((s) => s.id === values.serviceCategoryId);
  const [otherLocality, setOtherLocality] = useState(false);
  const [otherService, setOtherService] = useState(false);

  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());

  async function next() {
    const ok = await trigger([...STEPS[step].fields] as FieldPath<CareRequestInput>[], { shouldFocus: true });
    if (!ok) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    focusHeading();
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
    focusHeading();
  }
  function goTo(i: number) {
    setStep(i);
    focusHeading();
  }

  function submit() {
    setServerError(null);
    startTransition(async () => {
      const valid = await trigger();
      if (!valid) {
        const firstBad = STEPS.findIndex((s) => s.fields.some((f) => f in form.formState.errors));
        if (firstBad >= 0) goTo(firstBad);
        return;
      }
      const result = await submitCareRequestAction({ ...getValues(), idempotencyKey }).catch(() => ({
        ok: false as const,
        error: "We could not reach the server. Check your connection and try again; your answers are kept.",
      }));
      if (result.ok) {
        router.replace(`/request/status/${result.token}?new=1`);
        return;
      }
      setServerError(result.error);
      if ("fieldErrors" in result && result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as FieldPath<CareRequestInput>, { message });
        }
        const firstBad = STEPS.findIndex((s) => s.fields.some((f) => f in (result.fieldErrors ?? {})));
        if (firstBad >= 0) goTo(firstBad);
      }
    });
  }

  const err = (name: keyof CareRequestInput) => errors[name]?.message as string | undefined;
  const describe = (name: string) => (err(name as keyof CareRequestInput) ? `${name}-error` : undefined);

  const current = STEPS[step];

  return (
    <div>
      {/* Progress */}
      <nav aria-label="Progress" className="mb-3 rounded-[14px] bg-white px-5 py-4  ring-1 ring-rule">
        <p className="text-sm font-medium text-muted sm:hidden">
          Step {step + 1} of {STEPS.length}: <span className="text-navy-900">{current.title}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist-2 sm:hidden" aria-hidden>
          <div className="h-full rounded-full bg-field transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="hidden gap-2 sm:grid sm:grid-cols-6">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => goTo(i)}
                aria-current={i === step ? "step" : undefined}
                className="flex w-full flex-col items-start gap-1.5 text-left disabled:cursor-default"
              >
                <span className={`h-1.5 w-full rounded-full ${i <= step ? "bg-field" : "bg-field/10"}`} />
                <span className={`text-sm font-semibold ${i === step ? "text-text" : i < step ? "text-field" : "text-text-2"}`}>
                  {s.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) void next();
          else submit();
        }}
        noValidate
        className="rounded-[16px] bg-white p-6 shadow-[0_30px_70px_-45px_rgb(10_59_54/0.45)] ring-1 ring-rule sm:p-10"
      >
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-display font-bold tracking-[-0.015em] text-text outline-none sm:text-3xl">
          {
            {
              service: "What kind of care do you need?",
              care: "Tell us about the patient's needs",
              schedule: "Choose the shift and dates",
              location: "Where is care needed?",
              contact: "How can we reach you?",
              review: "Check your request",
            }[current.key]
          }
        </h2>

        <div className="mt-6 grid gap-6">
          {current.key === "service" && (
            <>
              <fieldset aria-describedby={describe("serviceCategoryId")}>
                <legend className="sr-only">Service</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {props.services.map((s) => (
                    <label key={s.id} className="block">
                      <input
                        type="radio"
                        value={s.id}
                        className="peer sr-only"
                        checked={values.serviceCategoryId === s.id}
                        onChange={() => {
                          setValue("serviceCategoryId", s.id, { shouldValidate: true });
                          setValue("otherServiceText", "");
                          setOtherService(false);
                        }}
                      />
                      <span className="block rounded-[var(--radius-control)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                        <ChoiceCard checked={values.serviceCategoryId === s.id}>
                          <span className="font-semibold text-navy-900">{s.name}</span>
                          <span className="mt-0.5 text-sm leading-snug text-muted">{s.summary}</span>
                        </ChoiceCard>
                      </span>
                    </label>
                  ))}
                  {props.allowOther && (
                    <label className="block">
                      <input
                        type="radio"
                        className="peer sr-only"
                        checked={otherService}
                        onChange={() => {
                          setOtherService(true);
                          setValue("serviceCategoryId", "");
                        }}
                      />
                      <span className="block rounded-[var(--radius-control)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                        <ChoiceCard checked={otherService}>
                          <span className="font-semibold text-navy-900">Something else / not sure</span>
                          <span className="mt-0.5 text-sm leading-snug text-muted">Describe it and we will advise you.</span>
                        </ChoiceCard>
                      </span>
                    </label>
                  )}
                </div>
              </fieldset>
              {otherService && (
                <div className="grid gap-2">
                  <Label htmlFor="otherServiceText">What do you need?</Label>
                  <input id="otherServiceText" className={`${inputClass} h-12`} maxLength={200} {...register("otherServiceText")} />
                </div>
              )}
              <ErrorText id="serviceCategoryId-error" message={err("serviceCategoryId") ?? err("otherServiceText")} />
              {selectedService?.isNursing && (
                <p className="rounded-2xl bg-field-soft/70 px-4 py-3 text-sm leading-relaxed text-text">
                  Home nursing is for clinical tasks such as injections, dressings or catheter care. For personal care
                  only, a GDA or attendant is usually the right choice. We will talk this through with you.
                </p>
              )}
            </>
          )}

          {current.key === "care" && (
            <>
              <fieldset className="grid gap-2" aria-describedby={describe("mobility")}>
                <legend className="text-[15px] font-semibold text-navy-900">How does the patient move around?</legend>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {(Object.keys(MOBILITY_LABELS) as (keyof typeof MOBILITY_LABELS)[]).map((m) => (
                    <label key={m} className="block">
                      <input type="radio" value={m} className="peer sr-only" {...register("mobility")} />
                      <span className="block rounded-[var(--radius-control)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                        <ChoiceCard checked={values.mobility === m}>
                          <span className="font-medium text-navy-900">{MOBILITY_LABELS[m]}</span>
                        </ChoiceCard>
                      </span>
                    </label>
                  ))}
                </div>
                <ErrorText id="mobility-error" message={err("mobility")} />
              </fieldset>

              <div className="grid gap-2">
                <Label htmlFor="careDescription">Briefly, what help is needed?</Label>
                <p id="careDescription-hint" className="text-sm text-muted">
                  For example: help walking and bathing after a hip operation. Please do not include medical reports or
                  ID numbers.
                </p>
                <textarea
                  id="careDescription"
                  rows={4}
                  maxLength={1000}
                  aria-invalid={!!err("careDescription")}
                  aria-describedby={`careDescription-hint ${describe("careDescription") ?? ""}`}
                  className={`${inputClass} py-3 leading-relaxed`}
                  {...register("careDescription")}
                />
                <ErrorText id="careDescription-error" message={err("careDescription")} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="preferredGender">Caregiver preference</Label>
                <select id="preferredGender" className={`${inputClass} h-12`} {...register("preferredGender")}>
                  {Object.entries(GENDER_PREF_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {selectedService?.isNursing && (
                <div className="grid gap-2">
                  <Label htmlFor="nursingSkillsRequired" optional>Nursing tasks needed</Label>
                  <input id="nursingSkillsRequired" placeholder="For example: daily injections, wound dressing" className={`${inputClass} h-12`} maxLength={300} {...register("nursingSkillsRequired")} />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="additionalRequirements" optional>Anything else we should know?</Label>
                <input id="additionalRequirements" placeholder="Language, stairs at home, pets, timing needs" className={`${inputClass} h-12`} maxLength={500} {...register("additionalRequirements")} />
              </div>
            </>
          )}

          {current.key === "schedule" && (
            <>
              <fieldset className="grid gap-2" aria-describedby={describe("shiftType")}>
                <legend className="text-[15px] font-semibold text-navy-900">Shift length</legend>
                <p className="text-sm text-muted">We offer 12-hour and 24-hour arrangements only.</p>
                <div className="mt-1 grid gap-3 sm:grid-cols-2">
                  {SHIFT_TYPES.map((s) => (
                    <label key={s} className="block">
                      <input
                        type="radio"
                        value={s}
                        className="peer sr-only"
                        {...register("shiftType", {
                          onChange: () => {
                            if (s === "24_HOURS") setValue("shiftTiming", "NO_PREFERENCE");
                          },
                        })}
                      />
                      <span className="block h-full rounded-[var(--radius-control)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                        <ChoiceCard checked={values.shiftType === s}>
                          <span className="tabular text-2xl font-bold text-navy-900">{SHIFT_LABELS[s]}</span>
                          <span className="mt-1 text-sm leading-relaxed text-muted">{SHIFT_DESCRIPTIONS[s]}</span>
                        </ChoiceCard>
                      </span>
                    </label>
                  ))}
                </div>
                <ErrorText id="shiftType-error" message={err("shiftType")} />
              </fieldset>

              {values.shiftType === "12_HOURS" && (
                <fieldset className="grid gap-2">
                  <legend className="text-[15px] font-semibold text-navy-900">Day or night?</legend>
                  <p className="text-sm text-muted">This only tells us when the 12 hours should fall.</p>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {(Object.keys(SHIFT_TIMING_LABELS) as (keyof typeof SHIFT_TIMING_LABELS)[]).map((t) => (
                      <label key={t} className="block">
                        <input type="radio" value={t} className="peer sr-only" {...register("shiftTiming")} />
                        <span className="block rounded-[var(--radius-control)] text-center peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                          <ChoiceCard checked={values.shiftTiming === t}>
                            <span className="text-sm font-medium text-navy-900">{SHIFT_TIMING_LABELS[t]}</span>
                          </ChoiceCard>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="grid gap-2 sm:max-w-xs">
                <Label htmlFor="startDate">Preferred start date</Label>
                <input
                  id="startDate"
                  type="date"
                  min={props.minDate}
                  max={props.maxDate}
                  aria-invalid={!!err("startDate")}
                  aria-describedby={describe("startDate")}
                  className={`${inputClass} h-12`}
                  {...register("startDate")}
                />
                <ErrorText id="startDate-error" message={err("startDate")} />
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-[15px] font-semibold text-navy-900">For how long, roughly?</legend>
                <div className="mt-1 grid max-w-sm grid-cols-[110px_1fr] gap-3">
                  <input
                    aria-label="Duration"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={365}
                    aria-invalid={!!err("durationValue")}
                    aria-describedby={describe("durationValue")}
                    className={`${inputClass} tabular h-12`}
                    {...register("durationValue")}
                  />
                  <select aria-label="Duration unit" className={`${inputClass} h-12`} {...register("durationUnit")}>
                    {Object.entries(DURATION_UNIT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <ErrorText id="durationValue-error" message={err("durationValue")} />
              </fieldset>

              <fieldset className="grid gap-2" aria-describedby={describe("arrangementType")}>
                <legend className="text-[15px] font-semibold text-navy-900">Type of arrangement</legend>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  {(Object.keys(ARRANGEMENT_LABELS) as (keyof typeof ARRANGEMENT_LABELS)[]).map((a) => (
                    <label key={a} className="block">
                      <input type="radio" value={a} className="peer sr-only" {...register("arrangementType")} />
                      <span className="block rounded-[var(--radius-control)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                        <ChoiceCard checked={values.arrangementType === a}>
                          <span className="font-medium text-navy-900">{ARRANGEMENT_LABELS[a]}</span>
                        </ChoiceCard>
                      </span>
                    </label>
                  ))}
                </div>
                <ErrorText id="arrangementType-error" message={err("arrangementType")} />
              </fieldset>
            </>
          )}

          {current.key === "location" && (
            <>
              <div className="grid gap-2 sm:max-w-sm">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  aria-invalid={!!err("city")}
                  aria-describedby={describe("city")}
                  className={`${inputClass} h-12`}
                  {...register("city", {
                    onChange: () => {
                      setValue("serviceAreaId", "");
                      setValue("locality", "");
                      setOtherLocality(false);
                    },
                  })}
                >
                  <option value="">Choose your city</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ErrorText id="city-error" message={err("city")} />
                {cities.length === 0 && <p className="text-sm text-muted">Service areas are being updated. Please call us.</p>}
              </div>

              {values.city && (
                <div className="grid gap-2 sm:max-w-sm">
                  <Label htmlFor="area">Locality</Label>
                  <select
                    id="area"
                    className={`${inputClass} h-12`}
                    value={otherLocality ? "__other" : (values.serviceAreaId ?? "")}
                    aria-invalid={!!err("locality")}
                    aria-describedby={describe("locality")}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__other") {
                        setOtherLocality(true);
                        setValue("serviceAreaId", "");
                        setValue("locality", "");
                        return;
                      }
                      setOtherLocality(false);
                      const area = cityAreas.find((a) => a.id === v);
                      setValue("serviceAreaId", v);
                      setValue("locality", area?.locality ?? "", { shouldValidate: true });
                      if (area?.pincode && !getValues("pincode")) setValue("pincode", area.pincode, { shouldValidate: true });
                    }}
                  >
                    <option value="">Choose your locality</option>
                    {cityAreas.map((a) => (
                      <option key={a.id} value={a.id}>{a.locality}</option>
                    ))}
                    <option value="__other">My locality is not listed</option>
                  </select>
                  {otherLocality && (
                    <>
                      <input aria-label="Your locality or neighbourhood" placeholder="Locality or neighbourhood" className={`${inputClass} h-12`} maxLength={120} {...register("locality")} />
                      <p className="text-sm text-muted">We will check whether we can arrange care there.</p>
                    </>
                  )}
                  <ErrorText id="locality-error" message={err("locality")} />
                </div>
              )}

              <div className="grid gap-2 sm:max-w-[200px]">
                <Label htmlFor="pincode">Pincode</Label>
                <input
                  id="pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  aria-invalid={!!err("pincode")}
                  aria-describedby={describe("pincode")}
                  className={`${inputClass} tabular h-12`}
                  {...register("pincode")}
                />
                <ErrorText id="pincode-error" message={err("pincode")} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address" optional>Full address</Label>
                <p className="text-sm text-muted">You can share this on the call instead.</p>
                <textarea id="address" rows={2} maxLength={300} autoComplete="street-address" className={`${inputClass} py-3`} {...register("address")} />
              </div>

              <p className="rounded-2xl bg-paper-2 px-4 py-3 text-sm leading-relaxed text-text">
                Availability depends on your locality and dates. We confirm on the call.
              </p>
            </>
          )}

          {current.key === "contact" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="customerName">Your name</Label>
                <input id="customerName" autoComplete="name" aria-invalid={!!err("customerName")} aria-describedby={describe("customerName")} className={`${inputClass} h-12`} {...register("customerName")} />
                <ErrorText id="customerName-error" message={err("customerName")} />
              </div>
              <div className="grid gap-2 sm:max-w-sm">
                <Label htmlFor="phone">Mobile number</Label>
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98xxxxxxxx" aria-invalid={!!err("phone")} aria-describedby={describe("phone")} className={`${inputClass} tabular h-12`} {...register("phone")} />
                <ErrorText id="phone-error" message={err("phone")} />
              </div>
              <div className="grid gap-2 sm:max-w-sm">
                <Label htmlFor="email" optional>Email</Label>
                <input id="email" type="email" autoComplete="email" aria-invalid={!!err("email")} aria-describedby={describe("email")} className={`${inputClass} h-12`} {...register("email")} />
                <ErrorText id="email-error" message={err("email")} />
              </div>
              <div className="grid gap-2 sm:max-w-sm">
                <Label htmlFor="relationship" optional>Your relationship to the patient</Label>
                <input id="relationship" placeholder="For example: son, daughter, self" className={`${inputClass} h-12`} maxLength={60} {...register("relationship")} />
              </div>
              <fieldset className="grid gap-2">
                <legend className="text-[15px] font-semibold text-navy-900">How should we contact you?</legend>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(Object.keys(CONTACT_METHOD_LABELS) as (keyof typeof CONTACT_METHOD_LABELS)[]).map((m) => (
                    <label key={m} className="block">
                      <input type="radio" value={m} className="peer sr-only" {...register("preferredContact")} />
                      <span className="block rounded-[var(--radius-control)] text-center peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                        <ChoiceCard checked={values.preferredContact === m}>
                          <span className="text-sm font-medium text-navy-900">{CONTACT_METHOD_LABELS[m]}</span>
                        </ChoiceCard>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register("website")} />
              <div className="grid gap-1.5">
                <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink">
                  <input type="checkbox" className="mt-1 size-5 shrink-0 accent-teal-600" aria-invalid={!!err("contactConsent")} aria-describedby={describe("contactConsent")} {...register("contactConsent")} />
                  <span>
                    {props.consentText}{" "}
                    <a href="/legal/privacy-policy" target="_blank" className="font-medium text-teal-700 underline">Privacy Policy</a>
                  </span>
                </label>
                <ErrorText id="contactConsent-error" message={err("contactConsent")} />
              </div>
            </>
          )}

          {current.key === "review" && (
            <ReviewSummary
              values={values}
              services={props.services}
              onEdit={goTo}
            />
          )}
        </div>

        {serverError && (
          <div role="alert" className="mt-6 rounded-[var(--radius-control)] border border-rose-700/20 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
            <div className="mt-2 text-ink">{props.contact}</div>
          </div>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={back} className={buttonClass("quiet", "lg")}>
              <ArrowLeftIcon size={18} aria-hidden /> Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="submit" className={buttonClass("field", "lg", "w-full px-7 sm:w-auto")}>
              Continue <ArrowRightIcon size={18} weight="bold" aria-hidden />
            </button>
          ) : (
            <button type="submit" disabled={isPending} aria-busy={isPending} className={buttonClass("field", "lg", "w-full px-7 sm:w-auto")}>
              {isPending ? "Sending your request…" : (<><CheckIcon size={18} weight="bold" aria-hidden /> Send request</>)}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewSummary({
  values,
  services,
  onEdit,
}: {
  values: CareRequestInput;
  services: Service[];
  onEdit: (step: number) => void;
}) {
  const service = services.find((s) => s.id === values.serviceCategoryId)?.name ?? values.otherServiceText ?? "-";
  const startDate = values.startDate
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${values.startDate}T00:00:00Z`))
    : "-";
  const groups: { step: number; title: string; rows: [string, string | undefined][] }[] = [
    { step: 0, title: "Service", rows: [["Service", service]] },
    {
      step: 1,
      title: "Care needs",
      rows: [
        ["Mobility", values.mobility ? MOBILITY_LABELS[values.mobility] : undefined],
        ["Help needed", values.careDescription],
        ["Caregiver preference", values.preferredGender ? GENDER_PREF_LABELS[values.preferredGender] : undefined],
        ["Nursing tasks", values.nursingSkillsRequired || undefined],
        ["Other needs", values.additionalRequirements || undefined],
      ],
    },
    {
      step: 2,
      title: "Shift and dates",
      rows: [
        ["Shift", values.shiftType ? SHIFT_LABELS[values.shiftType] : undefined],
        ["Day or night", values.shiftType === "12_HOURS" && values.shiftTiming ? SHIFT_TIMING_LABELS[values.shiftTiming] : undefined],
        ["Start date", startDate],
        ["Duration", `${values.durationValue} ${values.durationUnit ? DURATION_UNIT_LABELS[values.durationUnit] : ""}`],
        ["Arrangement", values.arrangementType ? ARRANGEMENT_LABELS[values.arrangementType] : undefined],
      ],
    },
    {
      step: 3,
      title: "Location",
      rows: [
        ["Area", [values.locality, values.city].filter(Boolean).join(", ")],
        ["Pincode", values.pincode],
        ["Address", values.address || undefined],
      ],
    },
    {
      step: 4,
      title: "Your details",
      rows: [
        ["Name", values.customerName],
        ["Mobile", values.phone],
        ["Email", values.email || undefined],
        ["Contact by", values.preferredContact ? CONTACT_METHOD_LABELS[values.preferredContact] : undefined],
      ],
    },
  ];
  return (
    <div className="grid gap-4">
      {groups.map((g) => (
        <section key={g.title} className="overflow-hidden rounded-2xl border border-rule">
          <header className="flex items-center justify-between border-b border-rule bg-paper-2 px-4 py-3">
            <h3 className="text-sm font-semibold text-navy-900">{g.title}</h3>
            <button type="button" onClick={() => onEdit(g.step)} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
              <PencilSimpleIcon size={14} aria-hidden /> Edit <span className="sr-only">{g.title}</span>
            </button>
          </header>
          <dl className="grid gap-x-4 gap-y-2 px-4 py-3 text-[15px] sm:grid-cols-[160px_1fr]">
            {g.rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="break-words text-ink">{v}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
      <p className="text-sm leading-relaxed text-muted">
        Sending this request does not book a caregiver. We will call you to discuss availability and suitability.
      </p>
    </div>
  );
}
