import type { ReactNode } from "react";

/** Deep-green field that opens every inner public page. */
export function PageIntro({ title, children, kicker }: { title: string; children?: ReactNode; kicker?: string }) {
  return (
    <div className="bg-field">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 md:pb-20 md:pt-20">
        {kicker && <p className="text-sm font-semibold text-marigold">{kicker}</p>}
        <h1 className="mt-2 max-w-[18ch] font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.025em] text-white sm:text-6xl">{title}</h1>
        {children && <div className="mt-5 max-w-[56ch] text-lg leading-relaxed text-field-soft">{children}</div>}
      </div>
    </div>
  );
}
