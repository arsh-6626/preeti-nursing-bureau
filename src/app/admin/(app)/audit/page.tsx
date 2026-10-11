import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { listAuditLog } from "@/lib/services/users";
import { formatDateTime } from "@/lib/domain/dates";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui/panel";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Audit log" };

const TYPES = ["ServiceRequest", "Assignment", "Payment", "FinancialAdjustment", "Caregiver", "VerificationRecord", "BusinessSettings", "ServiceCategory", "User"];

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const actor = await requirePermissionPage("audit:read");
  const sp = await searchParams;
  const type = typeof sp.type === "string" && TYPES.includes(sp.type) ? sp.type : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await listAuditLog(actor, page, type);
  return (
    <>
      <PageHeader title="Audit log" description="Important administrative and financial changes, newest first. Entries cannot be edited." />
      <form method="get" className="mb-4 flex gap-2">
        <select name="type" defaultValue={type ?? ""} aria-label="Record type" className="h-10 rounded-[var(--radius-control)] border border-line-strong px-2.5 text-sm">
          <option value="">All records</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className={buttonClass("secondary", "sm", "h-10")}>Filter</button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState title="No entries yet" />
      ) : (
        <TableWrap caption="Audit entries">
          <thead><tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Summary</Th></tr></thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{formatDateTime(r.createdAt)}</Td>
                <Td>{r.actor?.name ?? "Website"}</Td>
                <Td className="whitespace-nowrap font-mono text-xs">{r.action}</Td>
                <Td>{r.summary}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} basePath="/admin/audit" params={sp} />
    </>
  );
}
