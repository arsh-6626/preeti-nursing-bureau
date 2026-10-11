import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can, NotFoundError } from "@/lib/auth/permissions";
import { getAssignmentDetail } from "@/lib/services/assignments";
import { ASSIGNMENT_TRANSITIONS, CONFIRMABLE_FROM } from "@/lib/domain/assignment-status";
import {
  ASSIGNMENT_STATUS_LABELS,
  COMMISSION_BASIS_LABELS,
  DURATION_UNIT_LABELS,
  PAYMENT_DIRECTION_LABELS,
  PAYMENT_METHOD_LABELS,
  ADJUSTMENT_TARGET_LABELS,
} from "@/lib/domain/labels";
import { SHIFT_LABELS, fromDbShift } from "@/lib/domain/shift";
import { formatDate, formatDateTime, toDateOnlyString, todayInIndia } from "@/lib/domain/dates";
import { summarizeAssignmentLedger } from "@/lib/domain/finance";
import { calculateMargin } from "@/lib/domain/commission";
import { formatINR, moneyString } from "@/lib/domain/money";
import { PageHeader } from "@/components/admin/page-header";
import { AssignmentStatusBadge } from "@/components/admin/status";
import { DefinitionList, Notice, Panel } from "@/components/ui/panel";
import { LinkButton } from "@/components/ui/button";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { AssignmentTermsForm } from "@/components/admin/assignment-terms-form";
import {
  AcceptanceToggle,
  AdjustmentForm,
  CancelForm,
  ConfirmAssignmentForm,
  CorrectCommissionForm,
  PaymentForm,
  ReversePaymentForm,
  TransitionForm,
} from "@/components/admin/assignment-forms";
import { updateTermsAction } from "@/app/admin/actions/assignments";

export const metadata: Metadata = { title: "Assignment" };

export default async function AssignmentPage({ params, searchParams }: PageProps<"/admin/assignments/[id]">) {
  const actor = await requirePermissionPage("assignment:read");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await getAssignmentDetail(actor, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const a = detail.assignment;
  const shift = fromDbShift(a.shiftType);
  const canWrite = can(actor, "assignment:write");
  const preConfirm = CONFIRMABLE_FROM.includes(a.status);
  const bothAccepted = Boolean(a.customerAcceptedAt && a.caregiverAcceptedAt);
  const transitions = ASSIGNMENT_TRANSITIONS[a.status].filter((s) => s !== "CANCELLED");
  const closed = a.status === "CANCELLED" || a.status === "COMPLETED";
  const ledger = detail.finance
    ? summarizeAssignmentLedger({
        confirmed: a.confirmedAt !== null,
        customerAmount: detail.assignment.customerAmount,
        caregiverPayout: detail.assignment.caregiverPayout,
        payments: detail.assignment.payments,
        adjustments: detail.assignment.adjustments,
        commissions: detail.assignment.commissions,
      })
    : null;

  return (
    <>
      <PageHeader
        back={{ href: `/admin/leads/${a.request.id}`, label: a.request.reference }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {a.caregiver.fullName} <span className="tabular text-base font-normal text-muted">{a.caregiver.code}</span>
            <AssignmentStatusBadge status={a.status} />
          </span>
        }
        description={`${a.request.customer.name} · ${a.request.serviceCategory?.name ?? "Other care"} · ${SHIFT_LABELS[shift]} · ${formatDate(a.startDate)} to ${formatDate(a.endDate)}`}
        actions={
          a.status === "REPLACEMENT_REQUIRED" && canWrite && !a.replacedBy ? (
            <LinkButton href={`/admin/leads/${a.request.id}/match?replaces=${a.id}`} size="sm">Find replacement</LinkButton>
          ) : null
        }
      />

      {sp.confirmed === "1" && a.status === "CONFIRMED" && (
        <div className="mb-4"><Notice tone="success">Assignment confirmed. Mark it active when the caregiver starts.</Notice></div>
      )}
      {a.replaces && (
        <div className="mb-4"><Notice tone="info">Replacement for <Link className="font-semibold underline" href={`/admin/assignments/${a.replaces.id}`}>{a.replaces.caregiver.fullName}</Link>.</Notice></div>
      )}
      {a.replacedBy && (
        <div className="mb-4"><Notice tone="warning">Replaced by <Link className="font-semibold underline" href={`/admin/assignments/${a.replacedBy.id}`}>{a.replacedBy.caregiver.fullName}</Link> ({ASSIGNMENT_STATUS_LABELS[a.replacedBy.status]}).</Notice></div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid min-w-0 gap-6">
          {preConfirm && canWrite && (
            <Panel title="Acceptance and confirmation" description="Both sides must agree before you confirm. Nothing is confirmed automatically.">
              <ul className="grid gap-3">
                {(["customer", "caregiver"] as const).map((party) => {
                  const at = party === "customer" ? a.customerAcceptedAt : a.caregiverAcceptedAt;
                  return (
                    <li key={party} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line px-4 py-3">
                      <span className="flex items-center gap-2 text-sm">
                        {at ? <CheckCircleIcon size={20} weight="fill" className="text-leaf-600" aria-hidden /> : <CircleIcon size={20} className="text-muted" aria-hidden />}
                        <span className="font-semibold capitalize text-navy-900">{party}</span>
                        <span className="text-muted">{at ? `accepted ${formatDateTime(at)}` : "not yet accepted"}</span>
                      </span>
                      <AcceptanceToggle assignmentId={a.id} party={party} accepted={Boolean(at)} />
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                {can(actor, "assignment:confirm") ? (
                  bothAccepted ? (
                    <ConfirmAssignmentForm
                      assignmentId={a.id}
                      summary={`${a.caregiver.fullName} will be confirmed for ${a.request.customer.name}, ${SHIFT_LABELS[shift]}, from ${formatDate(a.startDate)} to ${formatDate(a.endDate)}. Availability and conflicts are checked again now.`}
                    />
                  ) : (
                    <p className="text-sm text-muted">Record both acceptances to enable confirmation.</p>
                  )
                ) : (
                  <p className="text-sm text-muted">Only an administrator can confirm assignments.</p>
                )}
              </div>
            </Panel>
          )}

          <Panel title="Arrangement">
            <DefinitionList
              items={[
                ["Customer", <Link key="c" className="text-teal-700 hover:underline" href={`/admin/leads/${a.request.id}`}>{a.request.customer.name} ({a.request.reference})</Link>],
                ["Caregiver", <Link key="g" className="text-teal-700 hover:underline" href={`/admin/caregivers/${a.caregiver.id}`}>{a.caregiver.fullName}</Link>],
                ["Shift", <strong key="s" className="font-semibold">{SHIFT_LABELS[shift]}</strong>],
                ["Dates", `${formatDate(a.startDate)} to ${formatDate(a.endDate)} (${a.durationValue} ${DURATION_UNIT_LABELS[a.durationUnit]})`],
                [shift === "24_HOURS" ? "Relief and rest plan" : "Staffing notes", <span key="p" className="whitespace-pre-line">{a.staffingPlan ?? "-"}</span>],
                ["Proposed by", `${a.createdBy.name}, ${formatDateTime(a.createdAt)}`],
                ["Confirmed", a.confirmedAt ? `${a.confirmedBy?.name ?? "-"}, ${formatDateTime(a.confirmedAt)}` : "Not confirmed"],
                ...(a.cancellationReason ? ([["Cancellation reason", a.cancellationReason]] as [string, string][]) : []),
              ]}
            />
          </Panel>

          {detail.finance && ledger && (
            <>
              <Panel title="Money" description="Agreed amounts, money actually moved, and commission are tracked separately.">
                <div className="grid gap-px overflow-hidden rounded-[var(--radius-control)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Customer charge", ledger.customerCharge, a.confirmedAt ? `Agreed ${formatINR(detail.assignment.customerAmount)}` : "Not owed until confirmed"],
                    ["Collected (net)", ledger.customerNetCollected, ledger.customerRefunded.isZero() ? "From payments recorded" : `After ${formatINR(ledger.customerRefunded)} refunded`],
                    ["Customer owes", ledger.customerOutstanding, ledger.customerOutstanding.isNegative() ? "Customer is in credit" : "Outstanding"],
                    ["Commission earned", ledger.commissionEarned, detail.assignment.commissionMethod === "FIXED" ? `Fixed ${formatINR(detail.assignment.commissionFixedAmount)}` : `${detail.assignment.commissionRate?.toString()}% of ${COMMISSION_BASIS_LABELS[detail.assignment.commissionBasis].toLowerCase()}`],
                    ["Caregiver payout", ledger.caregiverObligation, a.confirmedAt ? `Agreed ${formatINR(detail.assignment.caregiverPayout)}` : "Not owed until confirmed"],
                    ["Paid to caregiver", ledger.caregiverPaid, "From payments recorded"],
                    ["Caregiver owed", ledger.caregiverOutstanding, "Outstanding"],
                    ["Margin (info)", calculateMargin(ledger.customerCharge, ledger.caregiverObligation), "Charge minus payout. Not the commission."],
                  ].map(([label, value, sub]) => (
                    <div key={label as string} className="bg-paper p-4">
                      <p className="text-xs font-semibold text-muted">{label as string}</p>
                      <p className="tabular mt-1 text-lg font-semibold text-navy-900">{formatINR(value as never)}</p>
                      <p className="mt-0.5 text-xs text-muted">{sub as string}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Payments" description="Cash, UPI and bank transfers recorded by hand. Corrections are reversal entries.">
                {detail.assignment.payments.length > 0 && (
                  <div className="mb-5">
                    <TableWrap caption="Payments">
                      <thead><tr><Th>Date</Th><Th>Type</Th><Th>Method</Th><Th className="text-right">Amount</Th><Th>Reference</Th><Th>Recorded by</Th><Th /></tr></thead>
                      <tbody>
                        {detail.assignment.payments.map((p) => (
                          <tr key={p.id} className={p.entryType === "REVERSAL" ? "bg-rose-50/50" : undefined}>
                            <Td className="whitespace-nowrap">{formatDate(p.paidOn)}</Td>
                            <Td>{p.entryType === "REVERSAL" ? "Reversal: " : ""}{PAYMENT_DIRECTION_LABELS[p.direction]}</Td>
                            <Td>{PAYMENT_METHOD_LABELS[p.method]}{p.methodNote ? ` (${p.methodNote})` : ""}</Td>
                            <Td className="tabular text-right font-medium">{p.entryType === "REVERSAL" ? "−" : ""}{formatINR(p.amount)}</Td>
                            <Td className="text-xs">{p.transactionRef ?? "-"}{p.notes && <span className="block text-muted">{p.notes}</span>}</Td>
                            <Td className="text-xs text-muted">{p.recordedBy.name}</Td>
                            <Td>{p.entryType === "PAYMENT" && !detail.assignment.payments.some((x) => x.reversesPaymentId === p.id) && can(actor, "finance:write") && <ReversePaymentForm paymentId={p.id} assignmentId={a.id} />}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  </div>
                )}
                {a.confirmedAt && can(actor, "finance:write") ? (
                  <PaymentForm assignmentId={a.id} today={toDateOnlyString(todayInIndia())} />
                ) : (
                  <p className="text-sm text-muted">Payments can be recorded once the assignment is confirmed.</p>
                )}
              </Panel>

              <Panel title="Adjustments and commission">
                {detail.assignment.adjustments.length > 0 && (
                  <ul className="mb-4 grid gap-2 text-sm">
                    {detail.assignment.adjustments.map((x) => (
                      <li key={x.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                        <span>{ADJUSTMENT_TARGET_LABELS[x.target]}: {x.reason} <span className="text-xs text-muted">· {x.recordedBy.name}, {formatDateTime(x.createdAt)}</span></span>
                        <span className="tabular font-medium">{formatINR(x.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {a.confirmedAt && !closed && can(actor, "finance:write") && <AdjustmentForm assignmentId={a.id} />}
                <h3 className="mt-6 text-sm font-semibold text-navy-900">Commission ledger</h3>
                {detail.assignment.commissions.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">No commission recorded yet. It is recorded when the configured event (confirmation or completion) happens.</p>
                ) : (
                  <ul className="mt-2 grid gap-2 text-sm">
                    {detail.assignment.commissions.map((c) => (
                      <li key={c.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                        <span>{c.entryType === "RECOGNITION" ? "Recognised" : "Reversed"}{c.reason ? `: ${c.reason}` : ""} <span className="text-xs text-muted">· {formatDateTime(c.createdAt)}</span></span>
                        <span className="tabular font-medium">{formatINR(c.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {detail.assignment.commissions.length > 0 && !closed && can(actor, "finance:write") && <div className="mt-3"><CorrectCommissionForm assignmentId={a.id} /></div>}
              </Panel>
            </>
          )}

          <Panel title="History" description="Every change to this assignment, in order.">
            <ol className="grid gap-3">
              {a.events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="text-ink">
                    {e.fromStatus && e.fromStatus !== e.toStatus ? `${ASSIGNMENT_STATUS_LABELS[e.fromStatus]} → ` : ""}
                    <strong className="font-semibold text-navy-900">{ASSIGNMENT_STATUS_LABELS[e.toStatus]}</strong>
                    {e.note && <span className="text-muted"> · {e.note}</span>}
                  </p>
                  <p className="text-xs text-muted">{e.actor?.name ?? "System"} · {formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="grid h-fit gap-6">
          {canWrite && !closed && transitions.length > 0 && (
            <Panel title="Update progress">
              <TransitionForm assignmentId={a.id} options={transitions} />
            </Panel>
          )}
          {canWrite && preConfirm && detail.finance && (
            <Panel title="Edit terms" description="Editing resets both acceptances.">
              <AssignmentTermsForm
                action={updateTermsAction}
                hidden={{ assignmentId: a.id }}
                shiftType={shift}
                submitLabel="Save terms"
                defaults={{
                  startDate: toDateOnlyString(a.startDate),
                  durationValue: a.durationValue,
                  durationUnit: a.durationUnit,
                  quotedAmount: detail.assignment.quotedAmount ? moneyString(detail.assignment.quotedAmount) : "",
                  customerAmount: moneyString(detail.assignment.customerAmount),
                  caregiverPayout: moneyString(detail.assignment.caregiverPayout),
                  commissionMethod: detail.assignment.commissionMethod,
                  commissionRate: detail.assignment.commissionRate?.toString() ?? "",
                  commissionFixedAmount: detail.assignment.commissionFixedAmount?.toString() ?? "",
                  commissionBasis: detail.assignment.commissionBasis,
                  staffingPlan: a.staffingPlan ?? "",
                  financialNotes: detail.assignment.financialNotes ?? "",
                }}
              />
            </Panel>
          )}
          {canWrite && !closed && (
            <Panel title="Cancel">
              <CancelForm
                assignmentId={a.id}
                confirmed={a.confirmedAt !== null}
                finance={detail.finance && can(actor, "finance:write")}
                currentCharge={ledger ? moneyString(ledger.customerNetCollected) : ""}
                currentPayout={ledger ? moneyString(ledger.caregiverPaid) : ""}
              />
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
