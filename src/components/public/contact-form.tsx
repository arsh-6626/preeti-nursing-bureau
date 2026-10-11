"use client";

import { ActionForm, CheckboxField, SelectField, SubmitButton, TextareaField, TextField } from "@/components/ui/form";
import { submitContactInquiryAction } from "@/app/(public)/actions";

export function ContactForm({ consentText }: { consentText: string }) {
  return (
    <ActionForm action={submitContactInquiryAction} resetOnSuccess className="grid gap-5">
      <TextField name="name" label="Your name" autoComplete="name" required />
      <TextField name="phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" required hint="10-digit Indian mobile number" />
      <SelectField
        name="preferredContact"
        label="How should we contact you?"
        required
        defaultValue="PHONE"
        options={[
          { value: "PHONE", label: "Phone call" },
          { value: "WHATSAPP", label: "WhatsApp" },
        ]}
      />
      <TextareaField name="message" label="Message" rows={4} maxLength={600} hint="Please do not include medical reports or ID numbers." />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <CheckboxField name="contactConsent" label={consentText} />
      <div>
        <SubmitButton size="lg" variant="field" className="px-7" pendingLabel="Sending…">Request a call back</SubmitButton>
      </div>
    </ActionForm>
  );
}
