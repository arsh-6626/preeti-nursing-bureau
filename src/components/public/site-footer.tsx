import Link from "next/link";
import type { PublicSettings } from "@/lib/services/settings";
import { formatPhoneDisplay, telHref, whatsappHref } from "@/lib/contact";

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const tel = telHref(settings.phone);
  const wa = whatsappHref(settings.whatsapp, settings.whatsappPrefill);
  const year = new Date().getFullYear();
  const link = "text-on-ink-muted transition-colors hover:text-white";
  return (
    <footer className="on-ink mt-auto bg-ink-950 pb-24 text-on-ink sm:pb-0">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-12 pt-20 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-white">{settings.businessName}</p>
          <p className="mt-3 max-w-sm leading-relaxed text-on-ink-muted">
            Caregivers, patient attendants and home nurses for families in {settings.regionLabel}. Every arrangement is
            discussed and confirmed with you by phone.
          </p>
          <p className="mt-6 max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-on-ink">
            <strong className="font-semibold text-mint">Medical emergency?</strong> We are not an emergency service. Call 112, or 108 for an ambulance.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-on-ink-muted">Contact</p>
          <ul className="mt-4 space-y-2.5">
            {tel && settings.phone && <li><a className={link} href={tel}>{formatPhoneDisplay(settings.phone)}</a></li>}
            {wa && <li><a className={link} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
            {settings.email && <li><a className={link} href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {settings.businessHours && <li className="text-on-ink-muted">{settings.businessHours}</li>}
            {settings.address && <li className="text-on-ink-muted">{settings.address}</li>}
            <li><Link className={link} href="/contact">Contact page</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-on-ink-muted">Information</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link className={link} href="/services">Services</Link></li>
            <li><Link className={link} href="/legal/privacy-policy">Privacy Policy</Link></li>
            <li><Link className={link} href="/legal/terms-of-service">Terms of Service</Link></li>
            <li><Link className={link} href="/legal/cancellation-refund-policy">Cancellation and Refunds</Link></li>
            <li><Link className={link} href="/legal/service-limitations">Service Limitations</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p aria-hidden className="select-none overflow-hidden whitespace-nowrap text-[clamp(2.2rem,6.6vw,6.2rem)] font-semibold leading-[0.85] tracking-[-0.05em] text-white/[0.05]">
          {settings.businessName}
        </p>
        <p className="border-t border-white/10 py-6 text-sm text-on-ink-muted">© {year} {settings.businessName}</p>
      </div>
    </footer>
  );
}
