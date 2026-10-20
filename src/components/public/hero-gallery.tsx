import Image from "next/image";
import type { HomeImage } from "@/content/home-images";

/**
 * Slow, endless photo gallery for the hero: two columns drifting in opposite
 * directions on large screens, one row on phones. Each list is rendered twice
 * so the loop is seamless; the copy is hidden from assistive tech. Pauses on
 * hover and stands still under reduced motion (see .pnb-marquee in globals.css).
 */
export function HeroGallery({ images }: { images: HomeImage[] }) {
  const half = Math.ceil(images.length / 2);
  const columns = [images.slice(0, half), images.slice(half)];
  return (
    <>
      {/* Phones and tablets: one horizontal row. */}
      <div className="pnb-fade-x -mx-4 overflow-hidden sm:-mx-6 lg:hidden">
        <Track images={images} direction="left" className="flex w-max gap-3" tile="w-56 sm:w-64" sizes="256px" />
      </div>
      {/* Desktop: two vertical columns. */}
      <div className="pnb-fade-y hidden h-[640px] grid-cols-2 gap-4 overflow-hidden lg:grid">
        {columns.map((col, i) => (
          <Track key={i} images={col} direction={i === 0 ? "up" : "down"} className="flex flex-col gap-4" tile="w-full" sizes="300px" priorityFirst={i === 0} />
        ))}
      </div>
    </>
  );
}

function Track({
  images,
  direction,
  className,
  tile,
  sizes,
  priorityFirst,
}: {
  images: HomeImage[];
  direction: "left" | "up" | "down";
  className: string;
  tile: string;
  sizes: string;
  priorityFirst?: boolean;
}) {
  return (
    <div className={`pnb-marquee pnb-marquee-${direction} ${className}`}>
      {[0, 1].map((copy) =>
        images.map((image, i) => (
          <div key={`${copy}-${image.src}`} className={`relative aspect-square shrink-0 overflow-hidden rounded-[18px] bg-field-soft ${tile}`} aria-hidden={copy === 1 || undefined}>
            <Image src={image.src} alt={copy === 0 ? image.alt : ""} fill sizes={sizes} priority={priorityFirst && copy === 0 && i === 0} className="object-cover" />
          </div>
        )),
      )}
    </div>
  );
}
