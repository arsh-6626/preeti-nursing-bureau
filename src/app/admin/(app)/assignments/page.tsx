import type { Metadata } from "next";
import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth/dal";
import { listAssignments } from "@/lib/services/assignments";
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, SHIFT_TYPES, fromDbShift, parseShift } from "@/lib/domain/shift";
import { formatDate } from "@/lib/domain/dates";
import { formatINR } from "@/lib/domain/money";
import { PageHeader } from "@/components/admin/page-header";
import { AssignmentStatusBadge } from "@/components/admin/status";
import { EmptyState } from "@/components/ui/panel";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { buttonClass } from "@/components/ui/button";
import type { AssignmentStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Assignments" };
const select = "h-10 rounded-[var(--radius-control)] border border-line-strong bg-paper px-2.5 text-sm";

export default async function AssignmentsPage({ searchParams }: PageProps<"/admin/assignments">) {
  const actor = await requirePermissionPage("assignment:read");
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status in ASSIGNMENT_STATUS_LABELS ? (sp.status as AssignmentStatus) : undefined;
  const shift = parseShift(sp.shift);
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await listAssignments(actor, { status, shift, page });
  return (
    <>
      <PageHeader title="Assignments" description="Proposed, confirmed and past caregiver placements. Propose new ones from a lead." />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Status
          <select name="status" defaultValue={status ?? ""} className={select}>
            <option value="">Any</option>
            {Object.entries(ASSIGNMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Shift
          <select name="shift" defaultValue={shift ?? ""} className={select}>
            <option value="">Any</option>
            {SHIFT_TYPES.map((s) => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}
          </select>
        </label>
        <button className={buttonClass("secondary", "sm", "h-10")}>Apply</button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState title="No assignments yet">Open a lead and use “Find caregivers” to propose one.</EmptyState>
      ) : (
        <TableWrap caption="Assignments">
          <thead><tr><Th>Lead</Th><Th>Caregiver</Th><Th>Shift</Th><Th>Dates</Th><Th>Status</Th>{"customerAmount" in (result.rows[0] ?? {}) && <Th className="text-right">Agreed charge</Th>}</tr></thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.id}>
                <Td>
                  <Link href={`/admin/assignments/${r.id}`} className="tabular font-semibold text-teal-700 hover:underline">{r.request.reference}</Link>
                  <div className="text-xs text-muted">{r.request.customer.name}</div>
                </Td>
                <Td>{r.caregiver.fullName} <span className="tabular text-xs text-muted">{r.caregiver.code}</span></Td>
                <Td className="whitespace-nowrap">{SHIFT_LABELS[fromDbShift(r.shiftType)]}</Td>
                <Td className="whitespace-nowrap">{formatDate(r.startDate)} to {formatDate(r.endDate)}</Td>
                <Td><AssignmentStatusBadge status={r.status} /></Td>
                {"customerAmount" in r && <Td className="tabular text-right">{formatINR(r.customerAmount as never)}</Td>}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} basePath="/admin/assignments" params={sp} />
    </>
  );
}
