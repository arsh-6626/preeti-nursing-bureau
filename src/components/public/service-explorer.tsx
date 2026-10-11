"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";

type Service = { id: string; name: string; slug: string; summary: string; description: string; requiredSkills: string[]; isNursing: boolean };

/** Tabbed explorer: pick a service on the left, read it and start a request on the right. */
export function ServiceExplorer({ services }: { services: Service[] }) {
  const [activeId, setActiveId] = useState(services[0]?.id);
  const reduce = useReducedMotion();
  const active = services.find((s) => s.id === activeId) ?? services[0];
  if (!active) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_1.4fr] lg:gap-6">
      <div role="tablist" aria-label="Services" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {services.map((s) => {
          const selected = s.id === active.id;
          return (
            <button
              key={s.id}
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={selected}
              aria-controls="service-panel"
              onClick={() => setActiveId(s.id)}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-full border px-5 py-3 text-left text-[15px] font-medium transition-[background-color,color,border-color] duration-200 lg:rounded-2xl lg:py-3.5 ${
                selected ? "border-ink-950 bg-ink-950 text-white" : "border-ink-950/10 bg-white text-ink-950 hover:border-ink-950/30"
              }`}
            >
              <span className="whitespace-nowrap lg:whitespace-normal">{s.name}</span>
              {s.isNursing && (
                <span className={`hidden rounded-full px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider lg:inline ${selected ? "bg-mint text-ink-950" : "bg-fog-2 text-ink-700"}`}>
                  Nurse
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div id="service-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-white p-7 ring-1 ring-ink-950/[0.06] sm:p-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand">
              {active.isNursing ? "Qualified nursing" : "Personal care"}
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink-950 sm:text-4xl">{active.name}</h3>
            <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-ink-700">{active.description}</p>
            {active.requiredSkills.length > 0 && (
              <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
                {active.requiredSkills.map((skill) => (
                  <li key={skill} className="flex items-start gap-2.5 text-[15px] text-ink-950">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mint-soft text-brand-deep">
                      <CheckIcon size={12} weight="bold" aria-hidden />
                    </span>
                    {skill}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={`/request?service=${active.slug}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-950 px-6 font-semibold text-white transition-colors hover:bg-ink-800">
                Request this service
                <ArrowRightIcon size={17} weight="bold" aria-hidden />
              </Link>
              <Link href={`/services/${active.slug}`} className="inline-flex h-12 items-center rounded-full px-5 font-semibold text-ink-950 underline-offset-4 hover:underline">
                Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
