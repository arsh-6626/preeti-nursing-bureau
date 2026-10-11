import Link from "next/link";

/** Wordmark, or the configured logo image when one is set in Settings. */
export function Brand({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-[10px]" aria-label={`${name}, home`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo URL is configured at runtime
        <img src={logoUrl} alt="" className="h-9 w-auto" />
      ) : (
        <span aria-hidden className="grid size-9 place-items-center rounded-[10px] bg-field font-display text-lg font-bold text-white">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="whitespace-nowrap font-display text-[17px] font-bold tracking-[-0.01em] text-text">{name}</span>
    </Link>
  );
}
