import type { Metadata } from "next";
import Link from "next/link";
import { listActiveServices } from "@/lib/services/settings";
import { PageIntro } from "@/components/public/page-intro";
import { ServiceGrid } from "@/components/public/service-grid";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await listActiveServices();
  return (
    <>
      <PageIntro title="How we can help">
        Caring hands for your loved ones at home, from newborns to grandparents, on 12-hour or 24-hour shifts. Pick one to read more, or tell us what you need and we will help you choose.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        {services.length === 0 ? (
          <EmptyState title="No services are listed right now">Please call or WhatsApp us to discuss your needs.</EmptyState>
        ) : (
          <ServiceGrid services={services} headingLevel="h2" />
        )}
        <div className="mt-14 flex flex-wrap items-center gap-4">
          <Link href="/request" className={buttonClass("field", "lg", "px-7")}>Find a Caregiver</Link>
          <p className="text-text-2">Not sure which one? Choose &ldquo;Something else&rdquo; in the form.</p>
        </div>
      </div>
    </>
  );
}
