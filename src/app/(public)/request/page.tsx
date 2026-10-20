import type { Metadata } from "next";
import { getPublicSettings, listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { addDays, toDateOnlyString, todayInIndia } from "@/lib/domain/dates";
import { parseShift } from "@/lib/domain/shift";
import { RequestWizard } from "@/components/public/request-wizard";
import { ContactActions } from "@/components/public/contact-actions";
import { HeroNurse } from "@/components/public/hero-nurse";

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
      <div className="relative overflow-hidden bg-field pb-28 lg:pb-0">
        <div className="relative mx-auto grid max-w-6xl items-center gap-x-8 px-4 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1fr_1.1fr] lg:pt-6">
          <div>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.025em] text-white sm:text-6xl">Find a caregiver</h1>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-field-soft">
              A few questions so we can prepare before we call you. Nothing is booked until you agree on the phone.
            </p>
          </div>
          {/* The 3D room at home, with the nurse at the bedside. */}
          <div className="-mx-4 h-[260px] sm:mx-0 sm:h-[340px] lg:-mr-10 lg:h-[440px]">
            <HeroNurse />
          </div>
        </div>
      </div>
      <div className="relative mx-auto -mt-20 max-w-3xl px-4 pb-16 sm:px-6 lg:mt-10">
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
