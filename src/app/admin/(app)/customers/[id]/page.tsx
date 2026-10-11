import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can, NotFoundError } from "@/lib/auth/permissions";
import { getCustomerDetail } from "@/lib/services/customers";
import { SHIFT_LABELS, fromDbShift } from "@/lib/domain/shift";
import { formatDate } from "@/lib/domain/dates";
import { PageHeader } from "@/components/admin/page-header";
import { LeadStatusBadge } from "@/components/admin/status";
import { EmptyState, Panel } from "@/components/ui/panel";
import { CustomerForm } from "@/components/admin/customer-form";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const actor = await requirePermissionPage("customer:read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getCustomerDetail(actor, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  return (
    <>
      <PageHeader back={{ href: "/admin/customers", label: "Customers" }} title={c.name} description={`Customer since ${formatDate(c.createdAt)}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Requests">
          {c.requests.length === 0 ? (
            <EmptyState title="No requests" />
          ) : (
            <ul className="divide-y divide-line">
              {c.requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link href={`/admin/leads/${r.id}`} className="tabular font-semibold text-teal-700 hover:underline">{r.reference}</Link>
                    <span className="text-muted"> · {r.serviceCategory?.name ?? r.otherServiceText} · {SHIFT_LABELS[fromDbShift(r.shiftType)]} · {formatDate(r.createdAt)}</span>
                  </div>
                  <LeadStatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Details">
          {can(actor, "customer:write") ? (
            <CustomerForm defaults={c} />
          ) : (
            <p className="text-sm text-ink">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
          )}
        </Panel>
      </div>
    </>
  );
}
