"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import type { ShiftType } from "@/lib/domain/shift";

const COPY: Record<ShiftType, { title: string; points: string[] }> = {
  "12_HOURS": {
    title: "One caregiver, one 12-hour duty",
    points: ["Day or night, as you prefer", "Suits families who cover the remaining hours", "The same two lengths we offer everywhere"],
  },
  "24_HOURS": {
    title: "Round-the-clock care, planned with rest",
    points: ["Rest periods and relief agreed with you in advance", "No caregiver is expected to work 24 hours without breaks", "Suits patients who need someone present at all times"],
  },
};

/** Segmented 12 h / 24 h switch on the ink stage. Each side links into the request form. */
export function ShiftSwitch() {
  const [shift, setShift] = useState<ShiftType>("12_HOURS");
  const reduce = useReducedMotion();
  return (
    <div>
      <div role="radiogroup" aria-label="Shift length" className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1.5">
        {(["12_HOURS", "24_HOURS"] as const).map((s) => {
          const on = s === shift;
          return (
            <button
              key={s}
              role="radio"
              aria-checked={on}
              onClick={() => setShift(s)}
              className="relative rounded-full px-6 py-2.5 font-mono text-sm font-semibold sm:px-8"
            >
              {on && (
                <motion.span
                  layoutId="shift-pill"
                  className="absolute inset-0 rounded-full bg-mint"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={`relative ${on ? "text-ink-950" : "text-on-ink-muted"}`}>{s === "12_HOURS" ? "12 hours" : "24 hours"}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-10 grid items-end gap-10 lg:grid-cols-[auto_1fr]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={shift}
            aria-hidden
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-[clamp(7rem,22vw,15rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-white"
          >
            {shift === "12_HOURS" ? "12" : "24"}
            <span className="ml-2 text-[0.22em] tracking-normal text-mint">h</span>
          </motion.p>
        </AnimatePresence>
        <div className="pb-2">
          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">{COPY[shift].title}</h3>
          <ul className="mt-5 space-y-2.5">
            {COPY[shift].points.map((p) => (
              <li key={p} className="flex gap-3 text-lg text-on-ink-muted">
                <span aria-hidden className="mt-3 h-px w-5 shrink-0 bg-mint" />
                {p}
              </li>
            ))}
          </ul>
          <Link href={`/request?shift=${shift}`} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-mint px-6 font-semibold text-ink-950 transition-colors hover:bg-mint-soft">
            Start with {shift === "12_HOURS" ? "12 hours" : "24 hours"}
            <ArrowRightIcon size={17} weight="bold" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
