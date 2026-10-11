import { PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { telHref, whatsappHref, formatPhoneDisplay } from "@/lib/contact";
import { buttonClass } from "@/components/ui/button";

/** Call and WhatsApp buttons. Renders nothing for channels that are not configured. */
export function ContactActions({
  phone,
  whatsapp,
  prefill,
  size = "md",
  showNumbers = false,
}: {
  phone: string | null;
  whatsapp: string | null;
  prefill: string;
  size?: "md" | "lg";
  showNumbers?: boolean;
}) {
  const tel = telHref(phone);
  const wa = whatsappHref(whatsapp, prefill);
  if (!tel && !wa) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {tel && (
        <a href={tel} className={buttonClass("secondary", size, "rounded-full")}>
          <PhoneIcon size={20} weight="regular" aria-hidden />
          {showNumbers && phone ? `Call ${formatPhoneDisplay(phone)}` : "Call us"}
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", size, "rounded-full")}>
          <WhatsappLogoIcon size={20} weight="regular" aria-hidden />
          WhatsApp us
        </a>
      )}
    </div>
  );
}
