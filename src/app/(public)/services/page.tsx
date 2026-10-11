import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { listActiveServices } from "@/lib/services/settings";
import { PageIntro } from "@/components/public/page-intro";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await listActiveServices();
  return (
    <>
      <PageIntro title="Services">
        Caregivers and nurses for patients at home, on 12-hour or 24-hour arrangements. Choose a service to read more, or
        send a request and we will help you decide.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {services.length === 0 ? (
          <EmptyState title="No services are listed right now">Please call or WhatsApp us to discuss your needs.</EmptyState>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`/services/${s.slug}`} className="group grid gap-2 py-6 sm:grid-cols-[minmax(220px,1fr)_2fr_auto] sm:items-center sm:gap-8">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold text-navy-900 group-hover:text-teal-700">{s.name}</span>
                    {s.isNursing && <Badge tone="teal">Qualified nursing</Badge>}
                  </span>
                  <span className="leading-relaxed text-muted">{s.summary}</span>
                  <ArrowRightIcon size={20} className="hidden text-teal-700 sm:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-10">
          <LinkButton href="/request" size="lg">Find a Caregiver</LinkButton>
        </div>
      </div>
    </>
  );
}
