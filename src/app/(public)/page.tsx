import Link from "next/link";
import { ArrowRightIcon, ChatCircleTextIcon, CheckCircleIcon, MapPinIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { getPublicSettings, listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { ContactActions } from "@/components/public/contact-actions";
import { HeroCarton } from "@/components/public/hero-carton";
import { buttonClass } from "@/components/ui/button";
import { SHIFT_DESCRIPTIONS } from "@/lib/domain/shift";
import { FAQS } from "@/components/public/faqs";

export default async function HomePage() {
  const [settings, services, areas] = await Promise.all([getPublicSettings(), listActiveServices(), listActiveAreas()]);
  const everyday = services.filter((s) => !s.isNursing);
  const nursing = services.filter((s) => s.isNursing);
  const cities = [...new Set(areas.map((a) => a.city))];

  return (
    <>
      {/* Hero: the offer on the left, the 3D carton on the right (between headline and text on phones). */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="relative mx-auto grid max-w-6xl items-center gap-x-6 px-4 pb-10 pt-8 sm:px-6 lg:min-h-[620px] lg:grid-cols-[1.05fr_1fr] lg:pb-14 lg:pt-12">
          <h1 className="text-[2.1rem] font-semibold leading-[1.06] tracking-[-0.035em] text-navy-950 sm:text-[3rem] lg:col-start-1 lg:row-start-1 lg:self-end lg:text-[3.5rem]">
            {settings.heroHeadline}
          </h1>
          <div className="relative -mx-4 h-[330px] sm:mx-0 sm:h-[440px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[580px]">
            <div aria-hidden className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(closest-side,rgb(153_246_228/0.6),rgb(153_246_228/0))]" />
            <HeroCarton name={settings.businessName} region={settings.regionLabel} />
          </div>
          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <p className="mt-2 max-w-[44ch] text-lg leading-relaxed text-muted sm:text-xl lg:mt-6">{settings.heroSubtext}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/request" className={buttonClass("primary", "lg", "rounded-full px-7")}>
                Find a Caregiver
                <ArrowRightIcon size={18} weight="bold" aria-hidden />
              </Link>
              <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Services, grouped by the distinction families most need to understand. */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <h2 className="text-3xl font-bold tracking-tight text-navy-900">Care we arrange</h2>
        <p className="mt-3 max-w-[60ch] text-lg text-ink">
          Most families need everyday personal care. Some patients need a qualified nurse. We help you work out which.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">Everyday care and attendants</h3>
            <ul className="mt-3 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-line bg-line sm:grid-cols-2">
              {everyday.map((s, i) => (
                <li key={s.id} className={`bg-paper ${everyday.length % 2 === 1 && i === everyday.length - 1 ? "sm:col-span-2" : ""}`}>
                  <Link href={`/services/${s.slug}`} className="group flex h-full flex-col p-5 hover:bg-mist">
                    <span className="flex items-center justify-between gap-2 font-semibold text-navy-900 group-hover:text-teal-700">
                      {s.name}
                      <ArrowRightIcon size={16} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </span>
                    <span className="mt-1 text-sm leading-relaxed text-muted">{s.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="rounded-[var(--radius-panel)] bg-navy-900 p-6 text-white">
              {nursing.length === 0 ? (
                <p className="text-white/80">Nursing services are not listed at the moment. Call us to ask.</p>
              ) : (
                nursing.map((s) => (
                  <Link key={s.id} href={`/services/${s.slug}`} className="group block">
                    <span className="text-xl font-semibold group-hover:underline">{s.name}</span>
                    <span className="mt-2 block leading-relaxed text-white/80">{s.summary}</span>
                  </Link>
                ))
              )}
              <p className="mt-5 border-t border-white/15 pt-4 text-sm leading-relaxed text-white/75">
                Attendants and GDAs help with personal care. Injections, dressings, catheter or tube care need a nurse,
                working to your doctor&apos;s instructions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: a real sequence, so order is shown. */}
      <section id="how-it-works" className="scroll-mt-24 bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-navy-900">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
            {[
              { title: "Tell us what you need", body: "Send a short request online, or call or WhatsApp us." },
              { title: "We call you", body: "We talk through the patient's needs, the shift, the dates and your location." },
              { title: "We suggest a caregiver", body: "We share who is suitable and available, and what has been verified." },
              { title: "You decide", body: "Care is arranged only after you and the caregiver both agree." },
            ].map((step, i) => (
              <li key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="tabular grid size-10 place-items-center rounded-full bg-teal-600 text-base font-bold text-white" aria-hidden>
                    {i + 1}
                  </span>
                  {i < 3 && <span aria-hidden className="hidden h-px flex-1 bg-line-strong md:block" />}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">{step.title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The two arrangements, side by side as equals. */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <h2 className="text-3xl font-bold tracking-tight text-navy-900">Two kinds of shift</h2>
        <p className="mt-3 max-w-[60ch] text-lg text-ink">We arrange 12-hour and 24-hour care only, so everyone knows exactly what is agreed.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(["12_HOURS", "24_HOURS"] as const).map((s) => (
            <div key={s} className="rounded-[var(--radius-panel)] border border-line p-6">
              <p className="tabular text-5xl font-bold tracking-tight text-teal-700">
                {s === "12_HOURS" ? "12" : "24"}
                <span className="ml-2 text-lg font-semibold text-navy-900">hours</span>
              </p>
              <p className="mt-3 leading-relaxed text-ink">{SHIFT_DESCRIPTIONS[s]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How we match and what we check: only real practice. */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-navy-900">How we choose a caregiver</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink">
              A person on our team reviews every request. We look at the care needed, the shift, your locality, any
              preference for a male or female caregiver, and who is genuinely free on your dates.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              Nothing is booked automatically. If we cannot find someone suitable, we will tell you.
            </p>
          </div>
          <div className="rounded-[var(--radius-panel)] bg-mist p-6">
            <h3 className="font-semibold text-navy-900">What we tell you about every caregiver</h3>
            <ul className="mt-4 space-y-3">
              {[
                "Their experience and the kind of care they provide",
                "Which checks we have completed, such as identity and references, and which are still pending",
                "Whether they hold a nursing qualification, when the care needs one",
                "The shift they will work and the plan for rest on 24-hour care",
              ].map((t) => (
                <li key={t} className="flex gap-3 leading-relaxed text-ink">
                  <CheckCircleIcon size={22} weight="fill" className="mt-0.5 shrink-0 text-leaf-600" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Service area */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="flex items-start gap-3">
          <MapPinIcon size={28} className="mt-1 shrink-0 text-teal-700" aria-hidden />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-navy-900">Where we work</h2>
            <p className="mt-3 max-w-[62ch] text-lg text-ink">
              We arrange care in parts of {settings.regionLabel}. Availability depends on your locality and dates, so we
              confirm on the call.
            </p>
          </div>
        </div>
        {cities.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-3" aria-label="Cities">
            {cities.map((city) => (
              <li key={city} className="rounded-full border border-line-strong px-5 py-2.5 text-base font-semibold text-navy-900">{city}</li>
            ))}
          </ul>
        )}
      </section>

      {/* FAQ */}
      <section className="bg-mist">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1fr_1.6fr]">
          <h2 className="text-3xl font-bold tracking-tight text-navy-900">Common questions</h2>
          <div className="divide-y divide-line rounded-[var(--radius-panel)] border border-line bg-paper">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy-900">
                  {f.q}
                  <PlusIcon size={18} weight="bold" aria-hidden className="shrink-0 text-teal-700 transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 leading-relaxed text-ink">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--radius-panel)] bg-teal-700 px-6 py-10 text-white sm:px-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Talk to us about your family&apos;s needs</h2>
            <p className="mt-2 max-w-[52ch] text-white/85">Send a request and we will call you back. There is no charge for the conversation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/request" className={buttonClass("secondary", "lg", "border-white bg-white text-teal-800 hover:bg-teal-50 hover:text-teal-800")}>
              Find a Caregiver
            </Link>
            <Link href="/contact" className="inline-flex h-13 items-center gap-2 rounded-[var(--radius-control)] px-4 font-semibold text-white underline-offset-4 hover:underline">
              <ChatCircleTextIcon size={20} aria-hidden /> Contact options
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
