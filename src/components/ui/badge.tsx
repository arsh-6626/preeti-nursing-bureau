import type { ReactNode } from "react";

export type Tone = "neutral" | "teal" | "green" | "amber" | "rose" | "navy";

const tones: Record<Tone, string> = {
  neutral: "bg-mist text-muted ring-line",
  teal: "bg-teal-50 text-teal-800 ring-teal-100",
  green: "bg-leaf-50 text-leaf-700 ring-leaf-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-700/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-700/20",
  navy: "bg-navy-900 text-white ring-navy-900",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}
