import type { ReactNode } from "react";

export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{title}</h1>
        {children && <div className="mt-3 max-w-[62ch] text-lg leading-relaxed text-ink">{children}</div>}
      </div>
    </div>
  );
}
