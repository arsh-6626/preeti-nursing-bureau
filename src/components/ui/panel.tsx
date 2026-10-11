import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-[var(--radius-panel)] border border-line bg-paper ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-navy-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-dashed border-line-strong bg-mist/50 px-6 py-10 text-center">
      <p className="font-semibold text-navy-900">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "error" | "success"; children: ReactNode }) {
  const styles = {
    info: "bg-teal-50 text-teal-800 border-teal-100",
    warning: "bg-amber-50 text-amber-700 border-amber-700/20",
    error: "bg-rose-50 text-rose-700 border-rose-700/20",
    success: "bg-leaf-50 text-leaf-700 border-leaf-600/20",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-[var(--radius-control)] border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function DefinitionList({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[minmax(140px,max-content)_1fr]">
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-sm text-muted">{k}</dt>
          <dd className="text-sm text-ink sm:mb-0 [&:not(:last-child)]:mb-1">{v ?? "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
