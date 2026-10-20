"use client";

import { useState } from "react";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import {
  createAreaAction,
  saveBusinessSettingsAction,
  saveCommissionPolicyAction,
  saveContentPageAction,
  savePricingAction,
  saveServiceAction, createLivingAreaAction } from "@/app/admin/actions/settings";
import { COMMISSION_BASIS_LABELS, COMMISSION_RECOGNITION_LABELS, RATE_PERIOD_LABELS } from "@/lib/domain/labels";

const opts = (r: Record<string, string>) => Object.entries(r).map(([value, label]) => ({ value, label }));

export type BusinessDefaults = {
  businessName: string;
  logoUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  businessHours: string;
  address: string;
  regionLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  aboutText: string;
  consentText: string;
  whatsappPrefill: string;
  followUpDefaultHours: number;
  allowOtherService: boolean;
};

export function BusinessSettingsForm({ d }: { d: BusinessDefaults }) {
  return (
    <ActionForm action={saveBusinessSettingsAction} className="grid gap-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Business and contact</legend>
        <TextField name="businessName" label="Business name" required defaultValue={d.businessName} />
        <TextField name="regionLabel" label="Service region" required defaultValue={d.regionLabel} />
        <TextField name="phone" label="Telephone" defaultValue={d.phone} placeholder="+91 98xxx xxxxx" hint="Shown on the website with a tap-to-call link" />
        <TextField name="whatsapp" label="WhatsApp number" defaultValue={d.whatsapp} placeholder="+91 98xxx xxxxx" hint="Include the country code" />
        <TextField name="email" label="Email" type="email" defaultValue={d.email} />
        <TextField name="businessHours" label="Business hours" defaultValue={d.businessHours} placeholder="e.g. Monday to Saturday, 9am to 7pm" />
        <TextField name="address" label="Address" defaultValue={d.address} className="sm:col-span-2" />
        <TextField name="logoUrl" label="Logo link" defaultValue={d.logoUrl} hint="https:// link or /path in the public folder. Leave empty to use the wordmark." className="sm:col-span-2" />
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Website content</legend>
        <TextField name="heroHeadline" label="Home page headline" required defaultValue={d.heroHeadline} maxLength={120} />
        <TextareaField name="heroSubtext" label="Home page introduction" required rows={2} defaultValue={d.heroSubtext} maxLength={300} />
        <TextareaField name="aboutText" label="About page text" rows={8} defaultValue={d.aboutText} hint="Blank lines start new paragraphs. Lines starting with ## become headings." />
        <TextareaField name="consentText" label="Consent wording on forms" required rows={2} defaultValue={d.consentText} />
        <TextField name="whatsappPrefill" label="WhatsApp pre-filled message" required defaultValue={d.whatsappPrefill} hint="Keep it general. Never include medical details." />
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Operations</legend>
        <TextField name="followUpDefaultHours" label="First follow-up due after (hours)" type="number" min={1} max={720} required defaultValue={d.followUpDefaultHours} />
        <CheckboxField name="allowOtherService" label="Allow “Something else / not sure” on the request form" defaultChecked={d.allowOtherService} className="self-end pb-2" />
      </fieldset>
      <div><SubmitButton>Save settings</SubmitButton></div>
    </ActionForm>
  );
}

export function CommissionPolicyForm({ d }: { d: { commissionMethod: string; commissionRate: string; commissionFixedAmount: string; commissionBasis: string; commissionRecognition: string } }) {
  const [method, setMethod] = useState(d.commissionMethod);
  return (
    <ActionForm action={saveCommissionPolicyAction} className="grid gap-4 sm:grid-cols-2">
      <SelectField name="commissionMethod" label="Default method" required value={method} onChange={(e) => setMethod(e.target.value)} options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED", label: "Fixed amount per placement" }]} />
      <SelectField name="commissionRecognition" label="Commission counts as earned" required defaultValue={d.commissionRecognition} options={opts(COMMISSION_RECOGNITION_LABELS)} />
      <TextField name="commissionRate" label="Percentage (%)" inputMode="decimal" required defaultValue={d.commissionRate} className={method === "PERCENTAGE" ? "" : "opacity-60"} />
      <SelectField name="commissionBasis" label="Percentage is of" required defaultValue={d.commissionBasis} options={opts(COMMISSION_BASIS_LABELS)} />
      <TextField name="commissionFixedAmount" label="Fixed amount (₹)" inputMode="decimal" required defaultValue={d.commissionFixedAmount} className={method === "FIXED" ? "" : "opacity-60"} />
      <p className="text-xs text-muted sm:col-span-2">
        The difference between the customer charge and the caregiver payout is shown separately as margin and is never treated as commission. New assignments copy these defaults; existing ones keep their agreed terms.
      </p>
      <div className="sm:col-span-2"><SubmitButton>Save commission policy</SubmitButton></div>
    </ActionForm>
  );
}

export function AreaForm() {
  return (
    <ActionForm action={createAreaAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto] sm:items-end" resetOnSuccess>
      <TextField name="city" label="City" required placeholder="e.g. Noida" />
      <TextField name="locality" label="Locality" required />
      <TextField name="pincode" label="Pincode" inputMode="numeric" />
      <SubmitButton size="sm" variant="secondary" className="h-11">Add area</SubmitButton>
    </ActionForm>
  );
}

export function LivingAreaForm() {
  return (
    <ActionForm action={createLivingAreaAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" resetOnSuccess>
      <TextField name="name" label="Area name" required placeholder="e.g. Shakti Nagar" />
      <SubmitButton size="sm" variant="secondary" className="h-11">Add living area</SubmitButton>
    </ActionForm>
  );
}

export function PricingForm({ serviceCategoryId, shiftType, label, d }: { serviceCategoryId: string; shiftType: string; label: string; d: { ratePeriod: string; customerRate: string; caregiverPayout: string } }) {
  return (
    <ActionForm action={savePricingAction} className="grid gap-2 sm:grid-cols-[90px_1fr_1fr_130px_auto] sm:items-end">
      <input type="hidden" name="serviceCategoryId" value={serviceCategoryId} />
      <input type="hidden" name="shiftType" value={shiftType} />
      <p className="pb-3 text-sm font-semibold text-navy-900">{label}</p>
      <TextField name="customerRate" label="Customer rate (₹)" inputMode="decimal" required defaultValue={d.customerRate} />
      <TextField name="caregiverPayout" label="Caregiver payout (₹)" inputMode="decimal" required defaultValue={d.caregiverPayout} />
      <SelectField name="ratePeriod" label="Per" required defaultValue={d.ratePeriod} options={opts(RATE_PERIOD_LABELS)} />
      <SubmitButton size="sm" variant="secondary" className="h-11">Save</SubmitButton>
    </ActionForm>
  );
}

export function ContentPageForm({ d }: { d: { slug: string; title: string; body: string; needsReview: boolean } }) {
  return (
    <ActionForm action={saveContentPageAction} className="grid gap-3">
      <input type="hidden" name="slug" value={d.slug} />
      <TextField name="title" label="Title" required defaultValue={d.title} />
      <TextareaField name="body" label="Text" required rows={14} defaultValue={d.body} hint="Blank lines start new paragraphs. Lines starting with ## become headings." />
      <CheckboxField name="needsReview" label="This page still needs review before it can be relied on" defaultChecked={d.needsReview} />
      <div><SubmitButton size="sm">Save page</SubmitButton></div>
    </ActionForm>
  );
}

export function ServiceForm({ d }: { d: { id?: string; name: string; slug: string; summary: string; description: string; imageUrl: string; requiredSkills: string; indicativePrice: string; notes: string; isNursing: boolean; isActive: boolean } }) {
  return (
    <ActionForm action={saveServiceAction} className="grid gap-4 sm:grid-cols-2">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <TextField name="name" label="Name" required defaultValue={d.name} />
      <TextField name="slug" label="Web address (slug)" required defaultValue={d.slug} hint="e.g. elderly-care → /services/elderly-care" />
      <TextField name="summary" label="One-line summary" required defaultValue={d.summary} className="sm:col-span-2" />
      <TextareaField name="description" label="Description" required rows={5} defaultValue={d.description} className="sm:col-span-2" />
      <TextField name="requiredSkills" label="Required skills or qualifications" defaultValue={d.requiredSkills} hint="Separate with commas" className="sm:col-span-2" />
      <TextField name="indicativePrice" label="Indicative pricing text" defaultValue={d.indicativePrice} hint="Shown publicly. Leave empty to say charges are explained on the call." />
      <TextField name="imageUrl" label="Image link" defaultValue={d.imageUrl} hint="Only use photos you have the right to use" />
      <TextareaField name="notes" label="Service notes (public)" rows={2} defaultValue={d.notes} className="sm:col-span-2" />
      <CheckboxField name="isNursing" label="Qualified nursing service (not general caregiving)" defaultChecked={d.isNursing} />
      <CheckboxField name="isActive" label="Active and shown on the website" defaultChecked={d.isActive} />
      <div className="sm:col-span-2"><SubmitButton>{d.id ? "Save service" : "Create service"}</SubmitButton></div>
    </ActionForm>
  );
}
