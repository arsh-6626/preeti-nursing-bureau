import Link from "next/link";
import type { PublicSettings } from "@/lib/services/settings";
import { formatPhoneDisplay, telHref, whatsappHref } from "@/lib/contact";

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const tel = telHref(settings.phone);
  const wa = whatsappHref(settings.whatsapp, settings.whatsappPrefill);
  const year = new Date().getFullYear();
  const link = "text-field-soft transition-colors hover:text-white";
  return (
    <footer className="mt-auto bg-field-deep pb-24 text-white sm:pb-0">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-bold">{settings.businessName}</p>
          <p className="mt-3 max-w-sm leading-relaxed text-field-soft">
            Caregivers, patient attendants and home nurses for families in {settings.regionLabel}. Every arrangement is discussed and confirmed with you by phone.
          </p>
          <p className="mt-6 max-w-sm rounded-[12px] bg-marigold px-4 py-3 text-sm font-medium text-text">
            Medical emergency? We are not an emergency service. Call 112, or 108 for an ambulance.
          </p>
        </div>
        <div>
          <p className="font-semibold">Contact</p>
          <ul className="mt-4 space-y-2.5">
            {tel && settings.phone && <li><a className={link} href={tel}>{formatPhoneDisplay(settings.phone)}</a></li>}
            {wa && <li><a className={link} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
            {settings.email && <li><a className={link} href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {settings.businessHours && <li className="text-field-soft">{settings.businessHours}</li>}
            {settings.address && <li className="text-field-soft">{settings.address}</li>}
            <li><Link className={link} href="/contact">Contact page</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Information</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link className={link} href="/services">Services</Link></li>
            <li><Link className={link} href="/legal/privacy-policy">Privacy Policy</Link></li>
            <li><Link className={link} href="/legal/terms-of-service">Terms of Service</Link></li>
            <li><Link className={link} href="/legal/cancellation-refund-policy">Cancellation and Refunds</Link></li>
            <li><Link className={link} href="/legal/service-limitations">Service Limitations</Link></li>
            <li><Link className={link} href="/legal/disclaimer">Legal Disclaimer</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-white/15 px-4 py-6 text-sm text-field-soft sm:px-6">© {year} {settings.businessName}</div>
    </footer>
  );
}
