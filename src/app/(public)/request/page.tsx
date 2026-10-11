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
    <div className="bg-mist">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Find a caregiver</h1>
        <p className="mt-2 max-w-[56ch] text-ink">
          A few questions so we can prepare before we call you. Nothing is booked until you agree on the phone.
        </p>
        <div className="mt-8">
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
        </div>
        <div className="mt-8 text-sm text-muted">
          <p>Prefer to talk? </p>
          <div className="mt-2">{contact}</div>
        </div>
      </div>
    </div>
  );
}
