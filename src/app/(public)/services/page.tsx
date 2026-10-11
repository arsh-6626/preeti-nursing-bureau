import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { listActiveServices } from "@/lib/services/settings";
import { PageIntro } from "@/components/public/page-intro";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await listActiveServices();
  return (
    <>
      <PageIntro title="Care we arrange">
        Caregivers and nurses for patients at home, on 12-hour or 24-hour arrangements. Choose one to read more, or send a request and we will help you decide.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        {services.length === 0 ? (
          <EmptyState title="No services are listed right now">Please call or WhatsApp us to discuss your needs.</EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {services.map((s, i) => (
              <li key={s.id} className={services.length % 2 === 1 && i === services.length - 1 ? "sm:col-span-2" : undefined}>
                <Link
                  href={`/services/${s.slug}`}
                  className={`group flex h-full flex-col justify-between gap-10 rounded-[28px] p-8 transition-transform duration-300 hover:-translate-y-0.5 ${
                    s.isNursing ? "on-ink bg-ink-950" : "bg-white ring-1 ring-ink-950/[0.06] hover:ring-ink-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={`font-mono text-xs uppercase tracking-[0.14em] ${s.isNursing ? "text-mint" : "text-brand"}`}>
                      {s.isNursing ? "Qualified nursing" : "Personal care"}
                    </span>
                    <span className={`grid size-10 place-items-center rounded-full transition-colors ${s.isNursing ? "bg-white/10 text-white group-hover:bg-mint group-hover:text-ink-950" : "bg-fog text-ink-950 group-hover:bg-ink-950 group-hover:text-white"}`}>
                      <ArrowUpRightIcon size={18} weight="bold" aria-hidden />
                    </span>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-semibold tracking-[-0.03em] sm:text-3xl ${s.isNursing ? "text-white" : "text-ink-950"}`}>{s.name}</h2>
                    <p className={`mt-2 max-w-[44ch] text-lg leading-relaxed ${s.isNursing ? "text-on-ink-muted" : "text-ink-700"}`}>{s.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-14 flex flex-wrap items-center gap-4">
          <Link href="/request" className={buttonClass("ink", "lg", "px-7")}>Find a Caregiver</Link>
          <p className="text-ink-700">Not sure which one? Choose &ldquo;Something else&rdquo; in the form.</p>
        </div>
      </div>
    </>
  );
}
