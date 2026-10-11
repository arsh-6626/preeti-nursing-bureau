"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { GO_EVENT, prefersReducedMotion, type GoDetail } from "@/lib/client/go-event";

/**
 * A normal link that, on a plain left click, plays the hand-off animation
 * before navigating. Modified clicks (new tab etc.) and reduced motion behave
 * exactly like a regular link.
 */
export function CaregiverCta({ href = "/request", onClick, ...props }: ComponentProps<typeof Link> & { href?: string }) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (prefersReducedMotion()) return;
    e.preventDefault();
    const detail: GoDetail = { href: String(href), x: e.clientX, y: e.clientY };
    window.dispatchEvent(new CustomEvent<GoDetail>(GO_EVENT, { detail }));
  }
  return <Link href={href} onClick={handle} {...props} />;
}
