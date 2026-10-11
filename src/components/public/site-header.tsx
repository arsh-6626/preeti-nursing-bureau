"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ListIcon, XIcon, PhoneIcon } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui/button";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Floating pill navigation that sits over the ink stage at the top of every public page. */
export function SiteHeader({ brand, tel }: { brand: React.ReactNode; tel: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    // Close the menu after navigation (state adjusted during render, not in an effect).
    setLastPath(pathname);
    setOpen(false);
  }
  return (
    <header className="on-ink sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-ink-950/80 pl-4 pr-2 shadow-[0_10px_40px_-12px_rgb(6_26_29/0.6)] backdrop-blur-xl supports-[backdrop-filter]:bg-ink-950/65 sm:pl-5">
        {brand}
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-on-ink-muted transition-colors hover:text-white aria-[current=page]:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          {tel && (
            <a href={tel} className="hidden h-10 items-center gap-2 rounded-full px-3.5 text-[14px] font-medium text-on-ink-muted hover:text-white sm:inline-flex">
              <PhoneIcon size={17} aria-hidden />
              Call
            </a>
          )}
          <Link href="/request" className={buttonClass("mint", "sm", "h-10 px-4 max-sm:hidden")}>
            Find a Caregiver
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon size={22} aria-hidden /> : <ListIcon size={22} aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="mx-auto mt-2 max-w-6xl rounded-[28px] border border-white/10 bg-ink-950/95 p-3 backdrop-blur-xl lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block rounded-2xl px-4 py-3.5 text-lg font-medium text-white hover:bg-white/5">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid gap-2 p-1">
            <Link href="/request" className={buttonClass("mint", "lg", "w-full")}>Find a Caregiver</Link>
            {tel && (
              <a href={tel} className={buttonClass("onInk", "lg", "w-full")}>
                <PhoneIcon size={19} aria-hidden /> Call us
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
