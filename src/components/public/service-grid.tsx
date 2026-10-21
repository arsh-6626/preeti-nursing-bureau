import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { SERVICE_IMAGES } from "@/content/service-images";

type Service = { id: string; slug: string; name: string; summary: string; isNursing: boolean };

/** Services as photo cards, three across on large screens. */
export function ServiceGrid({ services, headingLevel = "h3" }: { services: Service[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => {
        const image = SERVICE_IMAGES[s.slug];
        return (
          <li key={s.id}>
            <Link href={`/services/${s.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-field-soft">
                {image && (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                {s.isNursing && <span className="absolute left-3 top-3 rounded-full bg-field px-3 py-1 text-xs font-semibold text-white">Qualified nurse</span>}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <Heading className="font-display text-xl font-bold tracking-[-0.01em] text-text decoration-marigold decoration-[3px] underline-offset-[5px] group-hover:underline">
                  {s.name}
                </Heading>
                <ArrowUpRightIcon size={20} className="mt-1 shrink-0 text-field transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </div>
              <p className="mt-1.5 leading-relaxed text-text-2">{s.summary}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
