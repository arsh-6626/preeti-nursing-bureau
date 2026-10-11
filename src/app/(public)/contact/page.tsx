import type { Metadata } from "next";
import { ClockIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { getPublicSettings, listActiveAreas } from "@/lib/services/settings";
import { formatPhoneDisplay, telHref, whatsappHref } from "@/lib/contact";
import { PageIntro } from "@/components/public/page-intro";
import { ContactForm } from "@/components/public/contact-form";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const [s, areas] = await Promise.all([getPublicSettings(), listActiveAreas()]);
  const tel = telHref(s.phone);
  const wa = whatsappHref(s.whatsapp, s.whatsappPrefill);
  const cities = [...new Set(areas.map((a) => a.city))];
  const rows = [
    tel && s.phone ? { icon: PhoneIcon, label: "Phone", value: <a href={tel} className="font-semibold text-teal-700 hover:underline">{formatPhoneDisplay(s.phone)}</a> } : null,
    wa ? { icon: WhatsappLogoIcon, label: "WhatsApp", value: <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 hover:underline">Chat on WhatsApp</a> } : null,
    s.email ? { icon: EnvelopeSimpleIcon, label: "Email", value: <a href={`mailto:${s.email}`} className="font-semibold text-teal-700 hover:underline">{s.email}</a> } : null,
    s.businessHours ? { icon: ClockIcon, label: "Hours", value: s.businessHours } : null,
    cities.length ? { icon: MapPinIcon, label: "Areas", value: `${cities.join(", ")} (${s.regionLabel})` } : null,
  ].filter((r) => r !== null);

  return (
    <>
      <PageIntro title="Contact us">Call, WhatsApp, or leave your number and we will call you back.</PageIntro>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          {rows.length > 0 ? (
            <dl className="space-y-5">
              {rows.map((r) => (
                <div key={r.label} className="flex gap-4">
                  <r.icon size={24} className="mt-0.5 shrink-0 text-teal-700" aria-hidden />
                  <div>
                    <dt className="text-sm text-muted">{r.label}</dt>
                    <dd className="mt-0.5 text-[17px] text-ink">{r.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted">Use the form to ask for a call back.</p>
          )}
          <div className="mt-10 rounded-[var(--radius-panel)] bg-mist p-6">
            <h2 className="font-semibold text-navy-900">Already know what you need?</h2>
            <p className="mt-1 text-sm text-muted">The care request form helps us prepare before we call.</p>
            <LinkButton href="/request" className="mt-4">Find a Caregiver</LinkButton>
          </div>
          <p className="mt-6 text-sm text-muted">
            <strong className="text-rose-700">Medical emergency?</strong> Call 112, or 108 for an ambulance.
          </p>
        </div>
        <div className="rounded-[var(--radius-panel)] border border-line p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-navy-900">Ask for a call back</h2>
          <p className="mb-6 mt-1 text-sm text-muted">We only use your number to talk to you about care.</p>
          <ContactForm consentText={s.consentText.replace("this request", "my message")} />
        </div>
      </div>
    </>
  );
}
