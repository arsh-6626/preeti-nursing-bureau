import type { Metadata } from "next";
import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth/dal";
import { listOutstanding, listPayments } from "@/lib/services/finance";
import { getSettings } from "@/lib/services/settings";
import { COMMISSION_BASIS_LABELS, COMMISSION_RECOGNITION_LABELS, PAYMENT_DIRECTION_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/domain/labels";
import { formatDate } from "@/lib/domain/dates";
import { formatINR } from "@/lib/domain/money";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState, Notice, Panel } from "@/components/ui/panel";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage({ searchParams }: PageProps<"/admin/finance">) {
  const actor = await requirePermissionPage("finance:read");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [payments, outstanding, settings] = await Promise.all([listPayments(actor, page), listOutstanding(actor), getSettings()]);
  const policy =
    settings.commissionMethod === "FIXED"
      ? `${formatINR(settings.commissionFixedAmount)} per placement`
      : `${settings.commissionRate.toString()}% of the ${COMMISSION_BASIS_LABELS[settings.commissionBasis].toLowerCase()}`;
  return (
    <>
      <PageHeader title="Finance" description="Manual payments, balances and the commission policy. Payments are recorded on each assignment." />
      <div className="mb-6">
        <Notice tone="info">
          Current commission policy: <strong>{policy}</strong>, recognised {COMMISSION_RECOGNITION_LABELS[settings.commissionRecognition].toLowerCase()}. Change it in{" "}
          <Link href="/admin/settings#commission" className="font-semibold underline">Settings</Link>.
        </Notice>
      </div>

      <Panel title="Outstanding balances" description="Confirmed assignments where the customer still owes money or the caregiver is still owed." className="mb-6">
        {outstanding.length === 0 ? (
          <EmptyState title="Nothing outstanding" />
        ) : (
          <TableWrap caption="Outstanding balances">
            <thead><tr><Th>Lead</Th><Th>Customer</Th><Th>Caregiver</Th><Th className="text-right">Customer owes</Th><Th className="text-right">Caregiver owed</Th></tr></thead>
            <tbody>
              {outstanding.map(({ a, ledger }) => (
                <tr key={a.id}>
                  <Td><Link href={`/admin/assignments/${a.id}`} className="tabular font-semibold text-teal-700 hover:underline">{a.request.reference}</Link></Td>
                  <Td>{a.request.customer.name}</Td>
                  <Td>{a.caregiver.fullName}</Td>
                  <Td className={`tabular text-right ${ledger.customerOutstanding.isNegative() ? "text-amber-700" : ""}`}>{formatINR(ledger.customerOutstanding)}{ledger.customerOutstanding.isNegative() && " (credit)"}</Td>
                  <Td className="tabular text-right">{formatINR(ledger.caregiverOutstanding)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title="Payment ledger" description="Every recorded payment, refund, payout and reversal.">
        {payments.rows.length === 0 ? (
          <EmptyState title="No payments recorded yet">Record payments from a confirmed assignment.</EmptyState>
        ) : (
          <>
            <TableWrap caption="Payments">
              <thead><tr><Th>Date</Th><Th>Lead</Th><Th>Type</Th><Th>Method</Th><Th className="text-right">Amount</Th><Th>Reference</Th><Th>Recorded by</Th></tr></thead>
              <tbody>
                {payments.rows.map((p) => (
                  <tr key={p.id} className={p.entryType === "REVERSAL" ? "bg-rose-50/50" : undefined}>
                    <Td className="whitespace-nowrap">{formatDate(p.paidOn)}</Td>
                    <Td><Link href={`/admin/assignments/${p.assignment.id}`} className="tabular text-teal-700 hover:underline">{p.assignment.request.reference}</Link><div className="text-xs text-muted">{p.direction === "CAREGIVER_PAYOUT" ? p.assignment.caregiver.fullName : p.assignment.request.customer.name}</div></Td>
                    <Td>{p.entryType === "REVERSAL" ? "Reversal: " : ""}{PAYMENT_DIRECTION_LABELS[p.direction]}</Td>
                    <Td>{PAYMENT_METHOD_LABELS[p.method]}</Td>
                    <Td className="tabular text-right font-medium">{p.entryType === "REVERSAL" ? "−" : ""}{formatINR(p.amount)}</Td>
                    <Td className="text-xs">{p.transactionRef ?? "-"}</Td>
                    <Td className="text-xs text-muted">{p.recordedBy.name}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={payments.page} pageCount={payments.pageCount} total={payments.total} basePath="/admin/finance" params={sp} />
          </>
        )}
      </Panel>
    </>
  );
}
