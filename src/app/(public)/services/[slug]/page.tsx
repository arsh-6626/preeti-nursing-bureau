import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, CheckIcon, InfoIcon } from "@phosphor-icons/react/ssr";
import { getActiveServiceBySlug, getPublicSettings } from "@/lib/services/settings";
import { PageIntro } from "@/components/public/page-intro";
import { ContactActions } from "@/components/public/contact-actions";
import { buttonClass } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getActiveServiceBySlug(slug);
  return { title: service?.name ?? "Service", description: service?.summary };
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([getActiveServiceBySlug(slug), getPublicSettings()]);
  if (!service) notFound();
  return (
    <>
      <PageIntro title={service.name} kicker={service.isNursing ? "Qualified nursing" : "Personal care"}>
        {service.summary}
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {service.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- image URL is configured by the business
            <img src={service.imageUrl} alt="" className="mb-10 aspect-[16/9] w-full rounded-[16px] object-cover" />
          )}
          <p className="max-w-[60ch] text-xl leading-relaxed text-text">{service.description}</p>
          {service.requiredSkills.length > 0 && (
            <>
              <h2 className="mt-14 text-2xl font-display font-bold tracking-[-0.015em] text-text">What we look for in the caregiver</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {service.requiredSkills.map((skill) => (
                  <li key={skill} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-text ring-1 ring-rule">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-field-soft text-field">
                      <CheckIcon size={13} weight="bold" aria-hidden />
                    </span>
                    {skill}
                  </li>
                ))}
              </ul>
            </>
          )}
          {service.notes && (
            <p className="mt-10 flex gap-3 rounded-2xl bg-field-soft/60 p-5 leading-relaxed text-text">
              <InfoIcon size={22} className="mt-0.5 shrink-0 text-field" aria-hidden />
              {service.notes}
            </p>
          )}
        </div>
        <aside className="h-fit rounded-[16px] bg-field p-8 lg:sticky lg:top-28">
          <p className="text-sm font-semibold text-marigold">Charges</p>
          <p className="mt-3 text-lg leading-relaxed text-field-soft">
            {service.indicativePrice ?? "Charges depend on the shift (12 or 24 hours) and the duration. We explain them clearly on the call before anything is arranged."}
          </p>
          <Link href={`/request?service=${service.slug}`} className={buttonClass("marigold", "lg", "mt-8 w-full")}>
            Request this service
            <ArrowRightIcon size={18} weight="bold" aria-hidden />
          </Link>
          <div className="mt-3">
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} tone="field" />
          </div>
        </aside>
      </div>
    </>
  );
}
