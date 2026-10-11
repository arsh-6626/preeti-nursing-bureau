import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ClockIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { getPublicSettings, listActiveAreas } from "@/lib/services/settings";
import { formatPhoneDisplay, telHref, whatsappHref } from "@/lib/contact";
import { PageIntro } from "@/components/public/page-intro";
import { ContactForm } from "@/components/public/contact-form";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const [s, areas] = await Promise.all([getPublicSettings(), listActiveAreas()]);
  const tel = telHref(s.phone);
  const wa = whatsappHref(s.whatsapp, s.whatsappPrefill);
  const cities = [...new Set(areas.map((a) => a.city))];
  const rows = [
    tel && s.phone ? { icon: PhoneIcon, label: "Phone", value: <a href={tel} className="font-semibold text-text underline-offset-4 hover:underline">{formatPhoneDisplay(s.phone)}</a> } : null,
    wa ? { icon: WhatsappLogoIcon, label: "WhatsApp", value: <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-text underline-offset-4 hover:underline">Chat on WhatsApp</a> } : null,
    s.email ? { icon: EnvelopeSimpleIcon, label: "Email", value: <a href={`mailto:${s.email}`} className="font-semibold text-text underline-offset-4 hover:underline">{s.email}</a> } : null,
    s.businessHours ? { icon: ClockIcon, label: "Hours", value: s.businessHours } : null,
    cities.length ? { icon: MapPinIcon, label: "Cities", value: cities.join(", ") } : null,
  ].filter((r) => r !== null);

  return (
    <>
      <PageIntro title="Talk to us">Call, WhatsApp, or leave your number and we will call you back.</PageIntro>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          {rows.length > 0 && (
            <dl className="divide-y divide-rule rounded-[16px] bg-white px-7 ring-1 ring-rule">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-4 py-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper-2 text-field">
                    <r.icon size={20} aria-hidden />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-text-2">{r.label}</dt>
                    <dd className="mt-0.5 text-lg text-text">{r.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
          <div className="rounded-[16px] bg-field p-7">
            <h2 className="text-2xl font-display font-bold tracking-[-0.015em] text-white">Already know what you need?</h2>
            <p className="mt-2 text-field-soft">The care request helps us prepare before we call.</p>
            <Link href="/request" className={buttonClass("marigold", "lg", "mt-6 px-7")}>
              Find a Caregiver
              <ArrowRightIcon size={18} weight="bold" aria-hidden />
            </Link>
          </div>
          <p className="px-2 text-text-2">
            <strong className="text-rose-700">Medical emergency?</strong> Call 112, or 108 for an ambulance.
          </p>
        </div>
        <div className="rounded-[16px] bg-white p-7 ring-1 ring-rule sm:p-10">
          <h2 className="text-3xl font-display font-bold tracking-[-0.02em] text-text">Ask for a call back</h2>
          <p className="mb-8 mt-2 text-text-2">We only use your number to talk to you about care.</p>
          <ContactForm consentText={s.consentText.replace("this request", "my message")} />
        </div>
      </div>
    </>
  );
}
