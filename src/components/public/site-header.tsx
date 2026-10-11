"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ListIcon, XIcon, PhoneIcon } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui/button";
import { CaregiverCta } from "./caregiver-cta";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/#who", label: "Who comes" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ brand, tel }: { brand: React.ReactNode; tel: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper-2/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper-2/80">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {brand}
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className="text-[15px] font-medium text-text-2 underline-offset-[6px] transition-colors hover:text-text hover:underline aria-[current=page]:text-text"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {tel && (
            <a href={tel} className="hidden h-10 items-center gap-2 px-2 text-[15px] font-medium text-text-2 hover:text-text sm:inline-flex">
              <PhoneIcon size={18} aria-hidden />
              Call
            </a>
          )}
          <CaregiverCta href="/request" className={buttonClass("field", "sm", "h-10 px-4 max-sm:hidden")}>
            Find a Caregiver
          </CaregiverCta>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-[10px] text-text hover:bg-rule/60 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon size={24} aria-hidden /> : <ListIcon size={24} aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-rule bg-paper-2 px-4 pb-5 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block border-b border-rule py-4 font-display text-xl font-semibold text-text">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2">
            <Link href="/request" className={buttonClass("field", "lg", "w-full")}>Find a Caregiver</Link>
            {tel && (
              <a href={tel} className={buttonClass("paper", "lg", "w-full")}>
                <PhoneIcon size={19} aria-hidden /> Call us
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
