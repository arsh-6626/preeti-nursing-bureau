import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { getPublicSettings, listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { ContactActions } from "@/components/public/contact-actions";
import Image from "next/image";
import { BEYOND_HOME, HERO_GALLERY, HOME_IMAGES, type HomeImage } from "@/content/home-images";
import { HeroGallery } from "@/components/public/hero-gallery";
import { JUSTDIAL_URL } from "@/content/links";
import { WhosWho } from "@/components/public/whos-who";
import { buttonClass } from "@/components/ui/button";
import { CaregiverCta } from "@/components/public/caregiver-cta";
import { FAQS } from "@/components/public/faqs";

const STEPS = [
  { title: "Tell us what you need", body: "A three-minute request online, or a call or WhatsApp." },
  { title: "We call you", body: "We talk through the patient, the shift, the dates and your locality." },
  { title: "We suggest someone", body: "We tell you who is free, suitable, and what has been checked." },
  { title: "You decide", body: "Care starts only when you and the caregiver both agree." },
];

export default async function HomePage() {
  const [settings, services, areas] = await Promise.all([getPublicSettings(), listActiveServices(), listActiveAreas()]);
  const cities = [...new Set(areas.map((a) => a.city))];
  const { caregiver, nurse, shift12, shift24, call } = HOME_IMAGES;

  return (
    <>
      {/* Hero: the headline beside a slow gallery of care at home, one moment per service. */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-[1320px] items-center gap-x-12 gap-y-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:pb-12 lg:pt-6">
          <div className="lg:pl-6">
            <h1 className="max-w-[16ch] font-display text-[2.7rem] font-bold leading-[0.98] tracking-[-0.03em] text-field sm:text-[4rem] lg:text-[4.4rem]">
              {settings.heroHeadline}
            </h1>
            <p className="mt-7 max-w-[40ch] text-lg leading-relaxed text-text-2 sm:text-xl">{settings.heroSubtext}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CaregiverCta href="/request" className={buttonClass("field", "lg", "px-6 text-[17px]")}>
                Find a Caregiver
                <ArrowRightIcon size={18} weight="bold" aria-hidden />
              </CaregiverCta>
              <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} size="lg" />
            </div>
          </div>
          <HeroGallery images={HERO_GALLERY} />
        </div>
      </section>

      {/* Who comes to your home */}
      <section id="who" className="mx-auto max-w-6xl scroll-mt-24 border-t border-text/15 px-4 py-20 sm:px-6 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="max-w-[14ch] font-display text-4xl font-bold leading-[1.02] tracking-[-0.025em] text-text sm:text-5xl">
              A caregiver or a nurse?
            </h2>
            <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-text-2">
              Most families need everyday personal care, not nursing. Here is what each one does, so you can ask for the right person. Not sure? We will help you decide on the call.
            </p>
          </div>
          <WhosWho />
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {[
            { image: caregiver, label: "GDA or attendant: everyday personal care" },
            { image: nurse, label: "Home nurse: clinical tasks, as prescribed" },
          ].map(({ image, label }) => (
            <figure key={label}>
              <Photo image={image} className="aspect-square w-full rounded-[16px] sm:aspect-[4/3]" sizes="(min-width: 640px) 50vw, 100vw" />
              <figcaption className="mt-3 text-text-2">{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Shift lengths */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 border-t border-text/15 py-20 md:py-28 lg:grid-cols-[0.85fr_1.15fr]">
          <h2 className="max-w-[14ch] font-display text-4xl font-bold leading-[1.02] tracking-[-0.025em] text-text sm:text-5xl">
            Two shift lengths: 12 hours or 24 hours
          </h2>
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <Photo image={shift12} className="mb-6 aspect-square w-full rounded-[16px]" sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw" />
              <h3 className="border-t-[3px] border-field pt-5 font-display text-2xl font-bold text-text">12 hours</h3>
              <p className="mt-3 text-lg leading-relaxed text-text-2">
                A caregiver is with the patient for a day or a night shift. The family, or a second caregiver, covers the remaining hours. Timings are agreed with you on the call.
              </p>
            </div>
            <div>
              <Photo image={shift24} className="mb-6 aspect-square w-full rounded-[16px]" sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw" />
              <h3 className="border-t-[3px] border-field pt-5 font-display text-2xl font-bold text-text">24 hours</h3>
              <p className="mt-3 text-lg leading-relaxed text-text-2">
                Round-the-clock care at home. Rest breaks and relief are planned with you before care starts, so no one works around the clock without a break.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services index */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-text/15 pt-20 md:pt-28">
          <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.025em] text-text sm:text-5xl">Care we arrange</h2>
          <Link href="/services" className="font-semibold text-field underline-offset-4 hover:underline">All services</Link>
        </div>
        <ul className="mt-10 border-t border-text/15">
          {services.map((s) => (
            <li key={s.id} className="border-b border-text/15">
              <Link href={`/services/${s.slug}`} className="group grid items-baseline gap-2 py-6 sm:grid-cols-[1fr_1.1fr_auto] sm:gap-8">
                <span className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-2xl font-bold tracking-[-0.02em] text-text decoration-marigold decoration-[3px] underline-offset-[6px] group-hover:underline sm:text-[1.9rem]">
                    {s.name}
                  </span>
                  {s.isNursing && <span className="rounded-[6px] bg-field px-2 py-0.5 text-xs font-semibold text-white">Nurse</span>}
                </span>
                <span className="text-text-2">{s.summary}</span>
                <ArrowUpRightIcon size={22} className="hidden text-text transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Photo image={call} className="aspect-square w-full rounded-[20px]" sizes="(min-width: 1024px) 480px, 100vw" />
          <div>
            <h2 className="max-w-[16ch] font-display text-4xl font-bold leading-[1.02] tracking-[-0.025em] text-text sm:text-5xl">
              A person on the phone at every step
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.title} className="border-t-[3px] border-field pt-5">
                  <span className="font-display text-5xl font-bold text-field">{i + 1}</span>
                  <h3 className="mt-3 font-display text-xl font-bold text-text">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-text-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Care beyond the bedroom */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t border-text/15 py-20 md:py-28">
          <h2 className="max-w-[18ch] font-display text-4xl font-bold leading-[1.02] tracking-[-0.025em] text-text sm:text-5xl">Care that goes where they go</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {BEYOND_HOME.map((b) => (
              <li key={b.src}>
                <Photo image={b} className="aspect-square w-full rounded-[16px]" sizes="(min-width: 640px) 33vw, 100vw" />
                <p className="mt-3 font-display text-xl font-bold text-text">{b.caption}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Practicalities */}
      <section className="mx-auto grid max-w-6xl border-t border-text/15 px-4 py-16 sm:px-6 md:grid-cols-3 md:py-20">
        <div className="pb-8 md:pb-0 md:pr-10">
          <h3 className="font-display text-2xl font-bold text-text">Where we work</h3>
          <p className="mt-3 text-lg leading-relaxed text-text">{cities.join(", ")}</p>
          <p className="mt-2 text-text-2">Availability depends on your locality and dates. We confirm on the call.</p>
        </div>
        <div className="border-t border-rule py-8 md:border-l md:border-t-0 md:px-10 md:py-0">
          <h3 className="font-display text-2xl font-bold text-text">Paying</h3>
          <p className="mt-3 text-lg leading-relaxed text-text">UPI, cash or bank transfer.</p>
          <p className="mt-2 text-text-2">Charges are explained on the call before anything starts.</p>
        </div>
        <div className="border-t border-rule pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <h3 className="font-display text-2xl font-bold text-text">Emergencies</h3>
          <p className="mt-3 text-lg leading-relaxed text-text">Call 112, or 108 for an ambulance.</p>
          <p className="mt-2 text-text-2">We arrange home care. We are not an emergency service.</p>
        </div>
      </section>

      {/* Reviews live on Justdial; we link out rather than copy or summarise them. */}
      <section className="mx-auto mb-16 max-w-6xl px-4 sm:px-6 md:mb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[20px] bg-field-soft px-6 py-10 sm:px-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-text sm:text-4xl">What families say about us</h2>
            <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-text-2">
              Read reviews from families we have worked with on our Justdial listing, Preeti Nursing Bureau (Regd.), Rana Pratap Bagh.
            </p>
          </div>
          <a href={JUSTDIAL_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("field", "lg", "shrink-0 px-6 text-[17px]")}>
            Read reviews on Justdial
            <ArrowUpRightIcon size={18} weight="bold" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 border-t border-text/15 py-20 md:py-28 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="max-w-[12ch] font-display text-4xl font-bold leading-[1.02] tracking-[-0.025em] text-text sm:text-5xl">Questions families ask</h2>
          <div className="border-t border-rule">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-bold text-text sm:text-xl">
                  {f.q}
                  <PlusIcon size={20} weight="bold" aria-hidden className="shrink-0 text-field transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="mt-3 max-w-[62ch] text-lg leading-relaxed text-text-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 border-t border-text/15 py-20 md:flex-row md:items-end md:py-28">
          <h2 className="max-w-[15ch] font-display text-5xl font-bold leading-[0.98] tracking-[-0.03em] text-field sm:text-7xl">Talk to a person about your family.</h2>
          <div className="flex flex-wrap gap-3">
            <CaregiverCta href="/request" className={buttonClass("field", "lg", "px-6 text-[17px]")}>
              Find a Caregiver
              <ArrowRightIcon size={18} weight="bold" aria-hidden />
            </CaregiverCta>
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={settings.whatsappPrefill} size="lg" />
          </div>
        </div>
      </section>
    </>
  );
}

function Photo({ image, className, sizes, priority }: { image: HomeImage; className: string; sizes: string; priority?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-field-soft ${className}`}>
      <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
