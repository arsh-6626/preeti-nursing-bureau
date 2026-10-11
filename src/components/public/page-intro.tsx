import type { ReactNode } from "react";

/** Ink stage that opens every inner public page, sitting under the floating nav. */
export function PageIntro({ title, children, kicker }: { title: string; children?: ReactNode; kicker?: string }) {
  return (
    <div className="on-ink relative -mt-[68px] overflow-hidden bg-ink-950 pt-[68px]">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(124_242_210/0.18),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 md:pb-20 md:pt-20">
        {kicker && <p className="font-mono text-xs uppercase tracking-[0.16em] text-mint">{kicker}</p>}
        <h1 className="mt-3 max-w-[18ch] text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl">{title}</h1>
        {children && <div className="mt-5 max-w-[56ch] text-lg leading-relaxed text-on-ink-muted">{children}</div>}
      </div>
    </div>
  );
}
