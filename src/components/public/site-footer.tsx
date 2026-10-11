import Link from "next/link";
import type { PublicSettings } from "@/lib/services/settings";
import { formatPhoneDisplay, telHref, whatsappHref } from "@/lib/contact";

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const tel = telHref(settings.phone);
  const wa = whatsappHref(settings.whatsapp, settings.whatsappPrefill);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-line bg-mist pb-20 sm:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-base font-bold text-navy-900">{settings.businessName}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Caregivers, patient attendants and home nurses for families in {settings.regionLabel}. Every arrangement is
            discussed and confirmed with you by phone.
          </p>
          <p className="mt-4 rounded-[var(--radius-control)] border border-rose-700/15 bg-paper px-3 py-2 text-sm text-ink">
            <strong className="text-rose-700">Medical emergency?</strong> We are not an emergency service. Call 112 or 108 for an ambulance.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-900">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            {tel && settings.phone && <li><a className="text-ink hover:text-teal-700" href={tel}>{formatPhoneDisplay(settings.phone)}</a></li>}
            {wa && <li><a className="text-ink hover:text-teal-700" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
            {settings.email && <li><a className="text-ink hover:text-teal-700" href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {settings.businessHours && <li className="text-muted">{settings.businessHours}</li>}
            {settings.address && <li className="text-muted">{settings.address}</li>}
            <li><Link className="text-ink hover:text-teal-700" href="/contact">Contact page</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-900">Information</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-ink hover:text-teal-700" href="/services">Services</Link></li>
            <li><Link className="text-ink hover:text-teal-700" href="/legal/privacy-policy">Privacy Policy</Link></li>
            <li><Link className="text-ink hover:text-teal-700" href="/legal/terms-of-service">Terms of Service</Link></li>
            <li><Link className="text-ink hover:text-teal-700" href="/legal/cancellation-refund-policy">Cancellation and Refunds</Link></li>
            <li><Link className="text-ink hover:text-teal-700" href="/legal/service-limitations">Service Limitations</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted sm:px-6">© {year} {settings.businessName}</p>
      </div>
    </footer>
  );
}
