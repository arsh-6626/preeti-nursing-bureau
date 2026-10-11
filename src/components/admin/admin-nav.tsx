"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AddressBookIcon,
  BellRingingIcon,
  ChartBarIcon,
  ClipboardTextIcon,
  CurrencyInrIcon,
  GearSixIcon,
  HandshakeIcon,
  ListIcon,
  ScrollIcon,
  UserListIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";

const ICONS = {
  dashboard: ChartBarIcon,
  leads: ClipboardTextIcon,
  followups: BellRingingIcon,
  assignments: HandshakeIcon,
  caregivers: UserListIcon,
  customers: AddressBookIcon,
  finance: CurrencyInrIcon,
  settings: GearSixIcon,
  users: UsersThreeIcon,
  audit: ScrollIcon,
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };

export function AdminNav({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    // Close the menu after navigation (state adjusted during render, not in an effect).
    setLastPath(pathname);
    setOpen(false);
  }
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const list = (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-[14px] font-medium transition-colors ${active ? "bg-paper text-navy-900 shadow-[var(--shadow-raise)]" : "text-ink hover:bg-paper/70 hover:text-navy-900"}`}
            >
              <Icon size={19} weight={active ? "fill" : "regular"} className={active ? "text-teal-700" : "text-muted"} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="tabular rounded-full bg-teal-600 px-1.5 text-xs font-semibold text-white">{item.badge}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-mist px-4 py-3 lg:hidden">
        <span className="text-sm font-semibold text-navy-900">Admin</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-[var(--radius-control)] hover:bg-paper"
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <XIcon size={22} aria-hidden /> : <ListIcon size={22} aria-hidden />}
        </button>
      </div>
      {open && (
        <nav id="admin-mobile-nav" aria-label="Admin" className="border-b border-line bg-mist px-3 py-3 lg:hidden">
          {list}
          <div className="mt-3 border-t border-line pt-3">{footer}</div>
        </nav>
      )}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-mist px-3 py-4 lg:flex">
        <nav aria-label="Admin" className="flex-1 overflow-y-auto">{list}</nav>
        <div className="border-t border-line pt-3">{footer}</div>
      </aside>
    </>
  );
}
