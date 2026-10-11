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
  tone = "paper",
}: {
  phone: string | null;
  whatsapp: string | null;
  prefill: string;
  size?: "md" | "lg";
  showNumbers?: boolean;
  tone?: "paper" | "field";
}) {
  const tel = telHref(phone);
  const wa = whatsappHref(whatsapp, prefill);
  if (!tel && !wa) return null;
  const cls = tone === "field" ? buttonClass("onField", size) : buttonClass("paper", size);
  return (
    <div className="flex flex-wrap gap-3">
      {tel && (
        <a href={tel} className={cls}>
          <PhoneIcon size={19} aria-hidden />
          {showNumbers && phone ? formatPhoneDisplay(phone) : "Call us"}
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={cls}>
          <WhatsappLogoIcon size={19} aria-hidden />
          WhatsApp
        </a>
      )}
    </div>
  );
}
