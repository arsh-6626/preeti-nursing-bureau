import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (typeof v === "string" && v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const link = "rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm font-medium hover:border-teal-600 hover:text-teal-700";
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p className="tabular">
        {total} {total === 1 ? "record" : "records"} · page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        {page > 1 ? <Link className={link} href={href(page - 1)}>Previous</Link> : <span className={`${link} opacity-40`} aria-disabled>Previous</span>}
        {page < pageCount ? <Link className={link} href={href(page + 1)}>Next</Link> : <span className={`${link} opacity-40`} aria-disabled>Next</span>}
      </div>
    </nav>
  );
}
