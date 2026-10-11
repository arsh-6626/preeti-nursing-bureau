import "server-only";
import { db } from "@/lib/db";
import { assertCan, can, type Actor } from "@/lib/auth/permissions";
import { addDays, parseDateOnly, isValidDateOnly, toDateOnlyString, todayInIndia } from "@/lib/domain/dates";
import { summarizeAssignmentLedger } from "@/lib/domain/finance";
import { Decimal, money, sumMoney } from "@/lib/domain/money";
import { OPEN_LEAD_STATUSES } from "@/lib/domain/lead-status";
import { LEAD_SOURCE_LABELS } from "@/lib/domain/labels";
import { leadScope } from "./leads";

export type DateRange = { from: Date; to: Date; fromStr: string; toStr: string };

export function resolveRange(fromParam?: string, toParam?: string): DateRange {
  const today = todayInIndia();
  const defaultFrom = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
  let from = fromParam && isValidDateOnly(fromParam) ? parseDateOnly(fromParam) : defaultFrom;
  let to = toParam && isValidDateOnly(toParam) ? parseDateOnly(toParam) : today;
  if (from > to) [from, to] = [to, from];
  return { from, to, fromStr: toDateOnlyString(from), toStr: toDateOnlyString(to) };
}

type MonthRow = { month: Date; count: bigint };

function monthKeys(range: DateRange): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), 1));
  while (cursor <= range.to && keys.length < 36) {
    keys.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export async function getDashboard(actor: Actor, range: DateRange) {
  assertCan(actor, "reports:read");
  const end = addDays(range.to, 1);
  const created = { gte: range.from, lt: end };
  const now = new Date();
  const scope = leadScope(actor);
  const showFinance = can(actor, "finance:read");

  const [
    newLeadsInRange,
    newLeadsOpen,
    awaitingFollowUp,
    activeAssignments,
    confirmedAssignments,
    completedInRange,
    cancelledInRange,
    leadsByServiceRaw,
    leadsBySourceRaw,
    leadsByShiftRaw,
    leadsInRangeTotal,
    leadsWithConfirmed,
    leadsWithProposal,
    leadsContacted,
    leadMonthly,
    assignmentOutcomeMonthly,
  ] = await Promise.all([
    db.serviceRequest.count({ where: { ...scope, createdAt: created } }),
    db.serviceRequest.count({ where: { ...scope, status: "NEW" } }),
    db.serviceRequest.count({ where: { ...scope, status: { in: [...OPEN_LEAD_STATUSES] }, nextFollowUpAt: { lte: now } } }),
    db.assignment.count({ where: { status: "ACTIVE", request: scope } }),
    db.assignment.count({ where: { status: "CONFIRMED", request: scope } }),
    db.assignmentEvent.count({ where: { toStatus: "COMPLETED", fromStatus: { not: "COMPLETED" }, createdAt: created, assignment: { request: scope } } }),
    db.statusChange.count({ where: { toStatus: "CANCELLED", createdAt: created, request: scope } }),
    db.serviceRequest.groupBy({ by: ["serviceCategoryId"], where: { ...scope, createdAt: created }, _count: { _all: true } }),
    db.serviceRequest.groupBy({ by: ["source"], where: { ...scope, createdAt: created }, _count: { _all: true } }),
    db.serviceRequest.groupBy({ by: ["shiftType"], where: { ...scope, createdAt: created }, _count: { _all: true } }),
    db.serviceRequest.count({ where: { ...scope, createdAt: created } }),
    db.serviceRequest.count({ where: { ...scope, createdAt: created, assignments: { some: { confirmedAt: { not: null } } } } }),
    db.serviceRequest.count({ where: { ...scope, createdAt: created, assignments: { some: {} } } }),
    db.serviceRequest.count({ where: { ...scope, createdAt: created, status: { not: "NEW" } } }),
    actor.role === "ADMIN"
      ? db.$queryRaw<MonthRow[]>`
          SELECT date_trunc('month', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata') AS month, count(*) AS count
          FROM "ServiceRequest" WHERE "createdAt" >= ${range.from} AND "createdAt" < ${end}
          GROUP BY 1 ORDER BY 1`
      : Promise.resolve([] as MonthRow[]),
    actor.role === "ADMIN"
      ? db.$queryRaw<{ month: Date; status: string; count: bigint }[]>`
          SELECT date_trunc('month', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata') AS month, "toStatus"::text AS status, count(*) AS count
          FROM "AssignmentEvent"
          WHERE "toStatus" IN ('COMPLETED', 'CANCELLED') AND ("fromStatus" IS NULL OR "fromStatus" <> "toStatus")
            AND "createdAt" >= ${range.from} AND "createdAt" < ${end}
          GROUP BY 1, 2 ORDER BY 1`
      : Promise.resolve([]),
  ]);

  const services = await db.serviceCategory.findMany({ select: { id: true, name: true } });
  const serviceName = new Map(services.map((s) => [s.id, s.name]));
  const months = monthKeys(range);
  const leadByMonth = new Map(leadMonthly.map((r) => [r.month.toISOString().slice(0, 7), Number(r.count)]));
  const outcomeByMonth = new Map<string, { completed: number; cancelled: number }>();
  for (const r of assignmentOutcomeMonthly) {
    const key = r.month.toISOString().slice(0, 7);
    const entry = outcomeByMonth.get(key) ?? { completed: 0, cancelled: 0 };
    if (r.status === "COMPLETED") entry.completed += Number(r.count);
    else entry.cancelled += Number(r.count);
    outcomeByMonth.set(key, entry);
  }

  const result = {
    cards: {
      newLeadsInRange,
      newLeadsOpen,
      awaitingFollowUp,
      activeAssignments,
      confirmedAssignments,
      completedInRange,
      cancelledInRange,
    },
    charts: {
      leadsByMonth: months.map((m) => ({ month: monthLabel(m), leads: leadByMonth.get(m) ?? 0 })),
      leadsByService: leadsByServiceRaw
        .map((r) => ({ name: r.serviceCategoryId ? (serviceName.get(r.serviceCategoryId) ?? "Unknown") : "Other (described)", value: r._count._all }))
        .sort((a, b) => b.value - a.value),
      leadsBySource: leadsBySourceRaw.map((r) => ({ name: LEAD_SOURCE_LABELS[r.source], value: r._count._all })),
      shiftDistribution: (["TWELVE_HOURS", "TWENTY_FOUR_HOURS"] as const).map((s) => ({
        name: s === "TWELVE_HOURS" ? "12 hours" : "24 hours",
        value: leadsByShiftRaw.find((r) => r.shiftType === s)?._count._all ?? 0,
      })),
      conversion: [
        { stage: "Leads", value: leadsInRangeTotal },
        { stage: "Contacted", value: leadsContacted },
        { stage: "Caregiver proposed", value: leadsWithProposal },
        { stage: "Assignment confirmed", value: leadsWithConfirmed },
      ],
      assignmentOutcomes: months.map((m) => ({
        month: monthLabel(m),
        completed: outcomeByMonth.get(m)?.completed ?? 0,
        cancelled: outcomeByMonth.get(m)?.cancelled ?? 0,
      })),
    },
    finance: null as null | Awaited<ReturnType<typeof getFinanceSummary>>,
  };
  if (showFinance) result.finance = await getFinanceSummary(range, months);
  return result;
}

async function getFinanceSummary(range: DateRange, months: string[]) {
  const end = addDays(range.to, 1);
  const [payments, commissions, confirmed] = await Promise.all([
    db.payment.findMany({ where: { paidOn: { gte: range.from, lt: end } }, select: { direction: true, entryType: true, amount: true, paidOn: true } }),
    db.commissionRecord.findMany({ where: { createdAt: { gte: range.from, lt: end } }, select: { amount: true, createdAt: true } }),
    db.assignment.findMany({
      where: { confirmedAt: { not: null } },
      include: { payments: true, adjustments: true, commissions: true },
    }),
  ]);

  const signedPayment = (p: { entryType: string; amount: { toString(): string } }) =>
    p.entryType === "REVERSAL" ? money(p.amount).negated() : money(p.amount);

  const collections = sumMoney(
    payments
      .filter((p) => p.direction !== "CAREGIVER_PAYOUT")
      .map((p) => (p.direction === "CUSTOMER_REFUND" ? signedPayment(p).negated() : signedPayment(p))),
  );
  const caregiverPaidInRange = sumMoney(payments.filter((p) => p.direction === "CAREGIVER_PAYOUT").map(signedPayment));
  const commissionInRange = sumMoney(commissions.map((c) => c.amount));

  let grossBilling = new Decimal(0);
  let payoutObligations = new Decimal(0);
  let outstandingCustomer = new Decimal(0);
  let outstandingCaregiver = new Decimal(0);
  for (const a of confirmed) {
    const ledger = summarizeAssignmentLedger({ confirmed: true, ...a });
    if (a.confirmedAt && a.confirmedAt >= range.from && a.confirmedAt < end) {
      grossBilling = grossBilling.plus(ledger.customerCharge);
      payoutObligations = payoutObligations.plus(ledger.caregiverObligation);
    }
    if (ledger.customerOutstanding.greaterThan(0)) outstandingCustomer = outstandingCustomer.plus(ledger.customerOutstanding);
    if (ledger.caregiverOutstanding.greaterThan(0)) outstandingCaregiver = outstandingCaregiver.plus(ledger.caregiverOutstanding);
  }

  const monthly = new Map(months.map((m) => [m, { collections: new Decimal(0), commission: new Decimal(0) }]));
  for (const p of payments) {
    if (p.direction === "CAREGIVER_PAYOUT") continue;
    const entry = monthly.get(p.paidOn.toISOString().slice(0, 7));
    if (entry) entry.collections = entry.collections.plus(p.direction === "CUSTOMER_REFUND" ? signedPayment(p).negated() : signedPayment(p));
  }
  for (const c of commissions) {
    const ist = new Date(c.createdAt.getTime() + 5.5 * 3_600_000);
    const entry = monthly.get(ist.toISOString().slice(0, 7));
    if (entry) entry.commission = entry.commission.plus(money(c.amount));
  }

  return {
    grossBilling: grossBilling.toFixed(2),
    payoutObligations: payoutObligations.toFixed(2),
    collections: collections.toFixed(2),
    caregiverPaidInRange: caregiverPaidInRange.toFixed(2),
    outstandingCustomer: outstandingCustomer.toFixed(2),
    outstandingCaregiver: outstandingCaregiver.toFixed(2),
    commissionInRange: commissionInRange.toFixed(2),
    monthly: months.map((m) => ({
      month: monthLabel(m),
      // Chart values only; the totals above stay as exact decimal strings.
      collections: Number(monthly.get(m)!.collections.toFixed(2)),
      commission: Number(monthly.get(m)!.commission.toFixed(2)),
    })),
  };
}
