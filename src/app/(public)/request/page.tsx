import type { Metadata } from "next";
import { getPublicSettings, listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { addDays, toDateOnlyString, todayInIndia } from "@/lib/domain/dates";
import { parseShift } from "@/lib/domain/shift";
import { RequestWizard } from "@/components/public/request-wizard";
import { ContactActions } from "@/components/public/contact-actions";

export const metadata: Metadata = {
  title: "Find a caregiver",
  description: "Tell us what care your family needs. We will call you to discuss availability and suitability.",
};

export default async function RequestPage({ searchParams }: PageProps<"/request">) {
  const sp = await searchParams;
  const [settings, services, areas] = await Promise.all([getPublicSettings(), listActiveServices(), listActiveAreas()]);
  const slug = typeof sp.service === "string" ? sp.service : undefined;
  const initialService = services.find((s) => s.slug === slug);
  const today = todayInIndia();
  const contact = <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} />;
  return (
    <>
      <div className="relative overflow-hidden bg-field pb-28">
        <div className="relative mx-auto max-w-3xl px-4 pt-12 sm:px-6 md:pt-16">
          <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.025em] text-white sm:text-6xl">Find a caregiver</h1>
          <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-field-soft">
            A few questions so we can prepare before we call you. Nothing is booked until you agree on the phone.
          </p>
        </div>
      </div>
      <div className="relative mx-auto -mt-20 max-w-3xl px-4 pb-16 sm:px-6">
        <RequestWizard
          services={services.map(({ id, name, slug, summary, isNursing }) => ({ id, name, slug, summary, isNursing }))}
          areas={areas}
          allowOther={settings.allowOtherService}
          consentText={settings.consentText}
          initialServiceId={initialService?.id}
          initialShift={parseShift(sp.shift)}
          minDate={toDateOnlyString(today)}
          maxDate={toDateOnlyString(addDays(today, 180))}
          contact={contact}
        />
        {(settings.phone || settings.whatsapp) && (
          <div className="mt-10 rounded-[16px] bg-white p-6 ring-1 ring-rule">
            <p className="font-semibold text-text">Prefer to talk?</p>
            <div className="mt-3">{contact}</div>
          </div>
        )}
      </div>
    </>
  );
}
