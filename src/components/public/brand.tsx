import Link from "next/link";

/** Wordmark, or the configured logo image when one is set in Settings. */
export function Brand({ name, logoUrl, compact = false }: { name: string; logoUrl: string | null; compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-md" aria-label={`${name}, home`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo URL is configured at runtime
        <img src={logoUrl} alt="" className="h-9 w-auto" />
      ) : (
        <span aria-hidden className="grid size-9 place-items-center rounded-[10px] bg-teal-600 text-[15px] font-bold tracking-tight text-white">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-navy-900 sm:text-base">{name}</span>
        {!compact && <span className="hidden text-sm text-muted sm:block">Patient care at home</span>}
      </span>
    </Link>
  );
}
