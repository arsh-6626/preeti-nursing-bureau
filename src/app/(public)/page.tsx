import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { getPublicSettings, listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { ContactActions } from "@/components/public/contact-actions";
import { HeroCarton } from "@/components/public/hero-carton";
import { ServiceExplorer } from "@/components/public/service-explorer";
import { ShiftSwitch } from "@/components/public/shift-switch";
import { ProcessSteps } from "@/components/public/process-steps";
import { Reveal } from "@/components/public/reveal";
import { buttonClass } from "@/components/ui/button";
import { FAQS } from "@/components/public/faqs";

export default async function HomePage() {
  const [settings, services, areas] = await Promise.all([getPublicSettings(), listActiveServices(), listActiveAreas()]);
  const cities = [...new Set(areas.map((a) => a.city))];
  const facts = [
    "12-hour shifts",
    "24-hour care with planned rest",
    "Every match reviewed by a person",
    "Pay by UPI, cash or bank transfer",
    ...cities,
  ];

  return (
    <>
      {/* Ink stage: headline and actions, with the 3D carton between headline and text on phones. */}
      <section className="on-ink relative -mt-[68px] overflow-hidden bg-ink-950 pt-[68px]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_40%,rgb(124_242_210/0.14),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-x-8 px-4 pb-14 pt-10 sm:px-6 lg:min-h-[calc(100dvh-68px)] lg:max-h-[860px] lg:grid-cols-[1.3fr_1fr] lg:pb-20 lg:pt-6">
          <h1 className="text-[2.55rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:col-start-1 lg:row-start-1 lg:self-end lg:text-[4.1rem]">
            {settings.heroHeadline}
          </h1>
          <div className="relative -mx-4 h-[340px] sm:mx-0 sm:h-[460px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[600px]">
            <div aria-hidden className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgb(124_242_210/0.32),transparent)]" />
            <HeroCarton name={settings.businessName} region={settings.regionLabel} />
          </div>
          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <p className="mt-2 max-w-[42ch] text-lg leading-relaxed text-on-ink-muted sm:text-xl lg:mt-7">{settings.heroSubtext}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/request" className={buttonClass("mint", "lg", "px-7")}>
                Find a Caregiver
                <ArrowRightIcon size={18} weight="bold" aria-hidden />
              </Link>
              <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} size="lg" tone="ink" />
            </div>
          </div>
        </div>
        {/* One strip of plain facts, no claims. */}
        <div className="relative border-t border-white/10 py-5" aria-label="At a glance">
          <div className="flex w-max gap-10 whitespace-nowrap pnb-marquee">
            {[...facts, ...facts].map((f, i) => (
              <span key={i} aria-hidden={i >= facts.length} className="flex items-center gap-10 font-mono text-sm uppercase tracking-[0.12em] text-on-ink-muted">
                {f}
                <span aria-hidden className="text-mint/60">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Services: explore, then request. */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
        <Reveal>
          <h2 className="max-w-[16ch] text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink-950 sm:text-6xl">
            You choose the care. We find the person.
          </h2>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-700">
            Most families need everyday personal care. Some patients need a qualified nurse. Pick what fits, or tell us and we will help you decide.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="mt-12">
          <ServiceExplorer services={services} />
        </Reveal>
      </section>

      {/* Shifts: the one rule that never bends. */}
      <section className="px-3 sm:px-5">
        <div className="on-ink relative mx-auto max-w-[1400px] overflow-hidden rounded-[36px] bg-ink-950 px-6 py-16 sm:px-12 md:py-24">
          <div aria-hidden className="pointer-events-none absolute -left-32 bottom-[-40%] size-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(124_242_210/0.16),transparent)]" />
          <div className="relative mx-auto max-w-6xl">
            <h2 className="max-w-[18ch] text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">Two shift lengths. No grey areas.</h2>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-on-ink-muted">
              Every arrangement is either 12 hours or 24 hours, so everyone knows exactly what has been agreed.
            </p>
            <div className="mt-12">
              <ShiftSwitch />
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="how-it-works" className="mx-auto grid max-w-6xl scroll-mt-24 gap-14 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="max-w-[12ch] text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink-950 sm:text-6xl">How it works</h2>
          <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-ink-700">Four steps, and a person on the phone at every one of them.</p>
          <Link href="/request" className={buttonClass("ink", "lg", "mt-9 px-7")}>
            Start a request
            <ArrowRightIcon size={18} weight="bold" aria-hidden />
          </Link>
        </div>
        <ProcessSteps />
      </section>

      {/* What families can count on: five tiles, five facts. */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-32">
        <Reveal>
          <h2 className="max-w-[20ch] text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink-950 sm:text-5xl">What you will always know</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <div className="on-ink flex h-full flex-col justify-between rounded-[28px] bg-ink-950 p-8 sm:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-mint">Before anyone arrives</p>
              <div className="mt-10">
                <h3 className="max-w-[20ch] text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Which checks are complete, and which are still pending</h3>
                <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-on-ink-muted">
                  We tell you plainly what has been verified for the caregiver we suggest, such as identity and references, and whether they hold a nursing qualification when the care needs one.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="flex h-full flex-col justify-between rounded-[28px] bg-mint p-8">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-800">Your decision</p>
              <h3 className="mt-16 text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-ink-950">Nothing is booked until you say yes.</h3>
            </div>
          </Reveal>
          <Reveal>
            <div className="flex h-full flex-col justify-between rounded-[28px] bg-white p-8 ring-1 ring-ink-950/[0.06]">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand">Paying</p>
              <div className="mt-12">
                <p className="text-3xl font-semibold tracking-[-0.03em] text-ink-950">UPI, cash or bank transfer</p>
                <p className="mt-3 text-ink-700">Amounts are explained on the call before anything starts.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="flex h-full flex-col justify-between rounded-[28px] bg-white p-8 ring-1 ring-ink-950/[0.06]">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand">Where we work</p>
              <div className="mt-12">
                <ul className="flex flex-wrap gap-2" aria-label="Cities">
                  {cities.map((c) => (
                    <li key={c} className="inline-flex items-center gap-1.5 rounded-full bg-fog px-3.5 py-1.5 text-[15px] font-medium text-ink-950">
                      <MapPinIcon size={14} aria-hidden className="text-brand" />
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-ink-700">Availability depends on your locality and dates. We confirm on the call.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="flex h-full flex-col justify-between rounded-[28px] bg-white p-8 ring-1 ring-ink-950/[0.06]">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-rose-700">Emergencies</p>
              <div className="mt-12">
                <p className="text-3xl font-semibold tracking-[-0.03em] text-ink-950">Call 112 or 108</p>
                <p className="mt-3 text-ink-700">We arrange home care. We are not an emergency or ambulance service.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-950/[0.07] bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="max-w-[12ch] text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink-950 sm:text-5xl">Questions families ask</h2>
          <div className="divide-y divide-ink-950/[0.08] border-y border-ink-950/[0.08]">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold text-ink-950">
                  {f.q}
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fog text-ink-950 transition-transform duration-200 group-open:rotate-45">
                    <PlusIcon size={16} weight="bold" aria-hidden />
                  </span>
                </summary>
                <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-700">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="bg-white px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="on-ink relative mx-auto max-w-[1400px] overflow-hidden rounded-[36px] bg-ink-950 px-6 py-20 text-center sm:px-12 md:py-28">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-full size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(124_242_210/0.22),transparent)]" />
          <div className="relative">
            <h2 className="mx-auto max-w-[16ch] text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-7xl">Talk to a person about your family.</h2>
            <p className="mx-auto mt-6 max-w-[44ch] text-lg text-on-ink-muted">Send a request and we will call you back. There is no charge for the conversation.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/request" className={buttonClass("mint", "lg", "px-7")}>
                Find a Caregiver
                <ArrowRightIcon size={18} weight="bold" aria-hidden />
              </Link>
              <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} size="lg" tone="ink" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
