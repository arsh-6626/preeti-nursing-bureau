"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";

type Kind = "care" | "rest" | "handover";
type Block = { from: number; to: number; label: string; kind: Kind };

// Hours are measured from 08:00 (0) so a 24-hour plan runs 0 to 24.
const PLANS: Record<"12" | "24", { title: string; length: number; blocks: Block[] }> = {
  "12": {
    title: "12-hour day shift, 8 am to 8 pm",
    length: 12,
    blocks: [
      { from: 0, to: 0.5, label: "Handover and settling in", kind: "handover" },
      { from: 0.5, to: 2, label: "Bath, grooming and dressing", kind: "care" },
      { from: 2, to: 3, label: "Breakfast and medicine reminders", kind: "care" },
      { from: 3, to: 4, label: "Short walk or exercises, as advised", kind: "care" },
      { from: 4, to: 6, label: "Lunch, then the patient rests", kind: "care" },
      { from: 6, to: 9, label: "Company, fluids, changing position", kind: "care" },
      { from: 9, to: 11, label: "Evening tea and dinner", kind: "care" },
      { from: 11, to: 12, label: "Notes for the family and handover", kind: "handover" },
    ],
  },
  "24": {
    title: "24-hour care, with rest planned in",
    length: 24,
    blocks: [
      { from: 0, to: 6, label: "Morning and afternoon routine", kind: "care" },
      { from: 6, to: 9, label: "Caregiver's rest break, with family or relief present", kind: "rest" },
      { from: 9, to: 14, label: "Evening routine and dinner", kind: "care" },
      { from: 14, to: 22, label: "Night: sleeps nearby, helps when needed", kind: "rest" },
      { from: 22, to: 24, label: "Morning routine and handover", kind: "handover" },
    ],
  },
};

const KIND_STYLE: Record<Kind, { bar: string; dot: string; name: string }> = {
  care: { bar: "bg-field", dot: "bg-field", name: "Care" },
  rest: { bar: "bg-marigold", dot: "bg-marigold", name: "Rest" },
  handover: { bar: "bg-text-2/40", dot: "bg-text-2/50", name: "Handover" },
};

function clock(h: number) {
  const total = (8 + h) % 24;
  const hour = Math.floor(total);
  const min = Math.round((total - hour) * 60);
  const suffix = hour < 12 ? "am" : "pm";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${min ? `:${String(min).padStart(2, "0")}` : ""} ${suffix}`;
}

/** An example day for each of the two shift lengths, drawn to scale. */
export function ShiftDay() {
  const [which, setWhich] = useState<"12" | "24">("12");
  const plan = PLANS[which];
  return (
    <div>
      <div role="tablist" aria-label="Shift length" className="flex gap-8 border-b border-text/15">
        {(["12", "24"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={which === k}
            onClick={() => setWhich(k)}
            className={`-mb-px border-b-[3px] pb-3 font-display text-xl font-bold transition-colors ${which === k ? "border-field text-field" : "border-transparent text-text-2 hover:text-text"}`}
          >
            {k} hours
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl font-bold tracking-[-0.015em] text-text sm:text-3xl">{plan.title}</h3>
          <ul className="flex gap-4 text-sm text-text-2">
            {(Object.keys(KIND_STYLE) as Kind[])
              .filter((k) => plan.blocks.some((b) => b.kind === k))
              .map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <span aria-hidden className={`size-2.5 rounded-sm ${KIND_STYLE[k].dot}`} />
                  {KIND_STYLE[k].name}
                </li>
              ))}
          </ul>
        </div>

        {/* To-scale bar */}
        <div className="mt-6" aria-hidden>
          <div className="flex h-14 overflow-hidden rounded-[8px]">
            {plan.blocks.map((b, i) => (
              <div
                key={i}
                className={`${KIND_STYLE[b.kind].bar} border-r-2 border-paper-2 last:border-r-0`}
                style={{ width: `${((b.to - b.from) / plan.length) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs tabular text-text-2">
            {Array.from({ length: plan.length / (plan.length === 12 ? 2 : 4) + 1 }, (_, i) => i * (plan.length === 12 ? 2 : 4)).map((h) => (
              <span key={h}>{clock(h)}</span>
            ))}
          </div>
        </div>

        <ol className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {plan.blocks.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-sm ${KIND_STYLE[b.kind].dot}`} />
              <span>
                <span className="tabular block text-sm text-text-2">
                  {clock(b.from)} to {clock(b.to)}
                </span>
                <span className="text-text">{b.label}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-text-2">
          An example only. Every routine, rest break and relief arrangement is agreed with your family on the call.
        </p>
      </div>

      <Link href={`/request?shift=${which === "12" ? "12_HOURS" : "24_HOURS"}`} className="mt-6 inline-flex items-center gap-2 font-semibold text-field underline-offset-4 hover:underline">
        Request {which}-hour care
        <ArrowRightIcon size={17} weight="bold" aria-hidden />
      </Link>
    </div>
  );
}
