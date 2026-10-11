import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckIcon, InfoIcon } from "@phosphor-icons/react/ssr";
import { getActiveServiceBySlug, getPublicSettings } from "@/lib/services/settings";
import { PageIntro } from "@/components/public/page-intro";
import { ContactActions } from "@/components/public/contact-actions";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <PageIntro title={service.name}>{service.summary}</PageIntro>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {service.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- image URL is configured by the business
            <img src={service.imageUrl} alt="" className="mb-8 aspect-[16/9] w-full rounded-[var(--radius-panel)] object-cover" />
          )}
          {service.isNursing && <Badge tone="teal">Qualified nursing service</Badge>}
          <p className="mt-4 max-w-[65ch] text-lg leading-relaxed text-ink">{service.description}</p>
          {service.requiredSkills.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-semibold text-navy-900">What we look for in the caregiver</h2>
              <ul className="mt-4 space-y-2.5">
                {service.requiredSkills.map((skill) => (
                  <li key={skill} className="flex gap-3 text-ink">
                    <CheckIcon size={20} weight="bold" className="mt-0.5 shrink-0 text-teal-700" aria-hidden />
                    {skill}
                  </li>
                ))}
              </ul>
            </>
          )}
          {service.notes && (
            <p className="mt-8 flex gap-3 rounded-[var(--radius-control)] border border-line bg-mist p-4 text-sm leading-relaxed text-ink">
              <InfoIcon size={20} className="mt-0.5 shrink-0 text-teal-700" aria-hidden />
              {service.notes}
            </p>
          )}
        </div>
        <aside className="h-fit rounded-[var(--radius-panel)] border border-line p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold text-navy-900">Charges</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {service.indicativePrice ?? "Charges depend on the shift (12 or 24 hours) and the duration. We explain them clearly on the call before anything is arranged."}
          </p>
          <LinkButton href={`/request?service=${service.slug}`} size="lg" className="mt-6 w-full">
            Request this service
          </LinkButton>
          <div className="mt-4">
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} />
          </div>
        </aside>
      </div>
    </>
  );
}
