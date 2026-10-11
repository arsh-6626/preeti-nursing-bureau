import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listCustomers } from "@/lib/services/customers";
import { CONTACT_METHOD_LABELS } from "@/lib/domain/labels";
import { formatDate } from "@/lib/domain/dates";
import { formatPhoneDisplay } from "@/lib/contact";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui/panel";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { LinkButton, buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const actor = await requirePermissionPage("customer:read");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await listCustomers(actor, q, page);
  return (
    <>
      <PageHeader
        title="Customers"
        description="Families and patients who have contacted the bureau."
        actions={can(actor, "customer:write") ? <LinkButton href="/admin/customers/new"><PlusIcon size={18} aria-hidden /> Add customer</LinkButton> : null}
      />
      <form method="get" className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Name, phone or email" aria-label="Search customers" className="h-10 w-72 rounded-[var(--radius-control)] border border-line-strong px-3 text-sm" />
        <button className={buttonClass("secondary", "sm", "h-10")}>Search</button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState title={q ? "No customers match" : "No customers yet"}>Customers are created automatically from requests, or added here.</EmptyState>
      ) : (
        <TableWrap caption="Customers">
          <thead><tr><Th>Name</Th><Th>Mobile</Th><Th>Email</Th><Th>Prefers</Th><Th className="text-right">Requests</Th><Th>Since</Th></tr></thead>
          <tbody>
            {result.rows.map((c) => (
              <tr key={c.id}>
                <Td><Link href={`/admin/customers/${c.id}`} className="font-semibold text-teal-700 hover:underline">{c.name}</Link>{c.relationship && <div className="text-xs text-muted">{c.relationship}</div>}</Td>
                <Td className="tabular whitespace-nowrap">{formatPhoneDisplay(c.phone)}</Td>
                <Td>{c.email ?? "-"}</Td>
                <Td>{CONTACT_METHOD_LABELS[c.preferredContact]}</Td>
                <Td className="tabular text-right">{c._count.requests}</Td>
                <Td className="whitespace-nowrap">{formatDate(c.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} basePath="/admin/customers" params={sp} />
    </>
  );
}
