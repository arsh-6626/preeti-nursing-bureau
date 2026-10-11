import Link from "next/link";

/** Wordmark, or the configured logo image when one is set in Settings. */
export function Brand({ name, logoUrl, tone = "light" }: { name: string; logoUrl: string | null; tone?: "light" | "dark" }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-full" aria-label={`${name}, home`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo URL is configured at runtime
        <img src={logoUrl} alt="" className="h-8 w-auto" />
      ) : (
        <span aria-hidden className="grid size-8 place-items-center rounded-[10px] bg-mint text-[15px] font-bold tracking-tight text-ink-950">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className={`whitespace-nowrap text-[15px] font-semibold tracking-tight ${tone === "light" ? "text-white" : "text-ink-950"}`}>{name}</span>
    </Link>
  );
}
