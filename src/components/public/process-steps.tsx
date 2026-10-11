"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

const STEPS = [
  { title: "Tell us what you need", body: "A short request online takes about three minutes. Or call or WhatsApp us." },
  { title: "We call you", body: "A person talks through the patient's needs, the shift, the dates and your locality." },
  { title: "We suggest a caregiver", body: "We share who is suitable and free on your dates, and which checks are complete." },
  { title: "You decide", body: "Care is arranged only after you and the caregiver both agree. Nothing is auto-booked." },
];

/** Vertical process with a rail that fills as the visitor scrolls through it. */
export function ProcessSteps() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <ol ref={ref} className="relative grid gap-12 pl-14 sm:pl-20">
      <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-px bg-ink-950/10 sm:left-[27px]" />
      <motion.span aria-hidden style={{ height: reduce ? "100%" : fill }} className="absolute left-[19px] top-3 w-px origin-top bg-brand sm:left-[27px]" />
      {STEPS.map((s, i) => (
        <motion.li
          key={s.title}
          initial={reduce ? false : { opacity: 0.45 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.6, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <span className="absolute -left-14 top-0 grid size-10 place-items-center rounded-full bg-ink-950 font-mono text-sm font-semibold text-mint sm:-left-20 sm:size-14 sm:text-base">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="text-2xl font-semibold tracking-[-0.025em] text-ink-950 sm:text-3xl">{s.title}</h3>
          <p className="mt-2 max-w-[48ch] text-lg leading-relaxed text-ink-700">{s.body}</p>
        </motion.li>
      ))}
    </ol>
  );
}
