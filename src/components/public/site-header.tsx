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
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
        {brand}
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className="rounded-md px-3 py-2 text-[15px] font-medium text-ink hover:text-teal-700 aria-[current=page]:text-teal-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {tel && (
            <a href={tel} className={buttonClass("quiet", "md", "max-sm:hidden")}>
              <PhoneIcon size={18} aria-hidden />
              Call
            </a>
          )}
          <Link href="/request" className={buttonClass("primary", "md", "max-sm:hidden")}>
            Find a Caregiver
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-[var(--radius-control)] text-navy-900 hover:bg-mist lg:hidden"
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
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-paper px-4 pb-5 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block border-b border-line py-3.5 text-base font-medium text-navy-900">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2">
            <Link href="/request" className={buttonClass("primary", "lg", "w-full")}>
              Find a Caregiver
            </Link>
            {tel && (
              <a href={tel} className={buttonClass("secondary", "lg", "w-full")}>
                <PhoneIcon size={20} aria-hidden /> Call us
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
