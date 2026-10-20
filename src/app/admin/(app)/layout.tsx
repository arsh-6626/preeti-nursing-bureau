import type { Metadata } from "next";
import Link from "next/link";
import { SignOutIcon } from "@phosphor-icons/react/ssr";
import { requireActorPage } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/services/settings";
import { leadScope } from "@/lib/services/leads";
import { ROLE_LABELS } from "@/lib/domain/labels";
import { OPEN_LEAD_STATUSES } from "@/lib/domain/lead-status";
import { AdminNav, type NavItem } from "@/components/admin/admin-nav";
import { logoutAction } from "@/app/admin/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const actor = await requireActorPage();
  const scope = leadScope(actor);
  const [settings, newLeads, dueFollowUps, openInquiries] = await Promise.all([
    getSettings(),
    db.serviceRequest.count({ where: { ...scope, status: "NEW" } }),
    db.serviceRequest.count({ where: { ...scope, status: { in: [...OPEN_LEAD_STATUSES] }, nextFollowUpAt: { lte: new Date() } } }),
    can(actor, "lead:create") ? db.contactInquiry.count({ where: { handledAt: null } }) : Promise.resolve(0),
  ]);
  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/leads", label: "Leads", icon: "leads", badge: newLeads + openInquiries || undefined },
    { href: "/admin/follow-ups", label: "Follow-ups", icon: "followups", badge: dueFollowUps || undefined },
    { href: "/admin/assignments", label: "Assignments", icon: "assignments" },
    { href: "/admin/caregivers", label: "Caregivers", icon: "caregivers" },
    { href: "/admin/nurses", label: "Nurses", icon: "nurses" },
    { href: "/admin/customers", label: "Customers", icon: "customers" },
  ];
  if (can(actor, "finance:read")) items.push({ href: "/admin/finance", label: "Finance", icon: "finance" });
  if (can(actor, "settings:write")) items.push({ href: "/admin/settings", label: "Settings", icon: "settings" });
  if (can(actor, "users:manage")) items.push({ href: "/admin/users", label: "Team", icon: "users" });
  if (can(actor, "audit:read")) items.push({ href: "/admin/audit", label: "Audit log", icon: "audit" });

  const footer = (
    <div className="px-1">
      <Link href="/admin/account" className="block rounded-md px-2 py-1 hover:bg-paper">
        <span className="block truncate text-sm font-semibold text-navy-900">{actor.name}</span>
        <span className="block text-xs text-muted">{ROLE_LABELS[actor.role]}</span>
      </Link>
      <form action={logoutAction} className="mt-1">
        <button type="submit" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-paper hover:text-navy-900">
          <SignOutIcon size={16} aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-paper lg:flex-row lg:bg-[linear-gradient(to_right,var(--color-mist)_15rem,var(--color-paper)_15rem)]">
      <AdminNav items={items} footer={footer} />
      <div className="min-w-0 flex-1 bg-paper">
        <div className="border-b border-line px-4 py-3 sm:px-8">
          <Link href="/" className="text-sm font-semibold text-navy-900 hover:text-teal-700">{settings.businessName}</Link>
          <span className="text-sm text-muted"> · Admin</span>
        </div>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
