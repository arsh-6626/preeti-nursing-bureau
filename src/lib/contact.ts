/** Builds tel: and WhatsApp links from configured numbers. Safe for client use. */

export function digitsOnly(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = digitsOnly(phone);
  return d.length >= 8 ? `tel:${d}` : null;
}

/**
 * WhatsApp click-to-chat link. The prefilled text is a short generic inquiry
 * and never contains patient or medical details.
 */
export function whatsappHref(number: string | null | undefined, text?: string): string | null {
  if (!number) return null;
  let d = number.replace(/\D/g, "");
  if (d.length === 10) d = `91${d}`;
  if (d.length < 11) return null;
  const query = text ? `?text=${encodeURIComponent(text.slice(0, 200))}` : "";
  return `https://wa.me/${d}${query}`;
}

export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return phone;
}
