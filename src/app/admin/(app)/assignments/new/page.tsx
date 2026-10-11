import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { getLeadForActor } from "@/lib/services/leads";
import { getDefaultTerms } from "@/lib/services/assignments";
import { computeEndDate, daysInclusive, todayInIndia, toDateOnlyString } from "@/lib/domain/dates";
import { formatINR, money, moneyString } from "@/lib/domain/money";
import { SHIFT_LABELS, fromDbShift } from "@/lib/domain/shift";
import { RATE_PERIOD_LABELS } from "@/lib/domain/labels";
import { PageHeader } from "@/components/admin/page-header";
import { Panel, Notice } from "@/components/ui/panel";
import { AssignmentTermsForm } from "@/components/admin/assignment-terms-form";
import { createAssignmentAction } from "@/app/admin/actions/assignments";

export const metadata: Metadata = { title: "Propose caregiver" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function NewAssignmentPage({ searchParams }: PageProps<"/admin/assignments/new">) {
  const actor = await requirePermissionPage("assignment:write");
  const sp = await searchParams;
  const requestId = typeof sp.request === "string" && UUID.test(sp.request) ? sp.request : null;
  const caregiverId = typeof sp.caregiver === "string" && UUID.test(sp.caregiver) ? sp.caregiver : null;
  const replaces = typeof sp.replaces === "string" && UUID.test(sp.replaces) ? sp.replaces : "";
  if (!requestId || !caregiverId) notFound();
  await getLeadForActor(actor, requestId).catch(() => notFound());
  const caregiver = await db.caregiver.findUnique({ where: { id: caregiverId } });
  if (!caregiver || caregiver.archivedAt) notFound();
  const { settings, request, pricingRule, caregiverPayoutRate, caregiverPayoutPeriod } = await getDefaultTerms(requestId, caregiverId);
  const shift = fromDbShift(request.shiftType);

  const today = todayInIndia();
  const start = request.startDate < today ? today : request.startDate;
  const end = computeEndDate(start, request.durationValue, request.durationUnit);
  const days = daysInclusive(start, end);
  const months = money(days).dividedBy(30);
  const total = (rate: unknown, period: "PER_DAY" | "PER_MONTH") =>
    rate == null ? "" : moneyString(money(String(rate)).times(period === "PER_DAY" ? days : months));
  const suggestedCustomer = pricingRule ? total(pricingRule.customerRate, pricingRule.ratePeriod) : "";
  const suggestedPayout = caregiverPayoutRate
    ? total(caregiverPayoutRate, caregiverPayoutPeriod)
    : pricingRule
      ? total(pricingRule.caregiverPayout, pricingRule.ratePeriod)
      : "";
  const suggestion = pricingRule
    ? `Suggested from pricing: ${formatINR(pricingRule.customerRate)} ${RATE_PERIOD_LABELS[pricingRule.ratePeriod]} for ${days} days. Adjust to what was actually agreed.`
    : "No pricing is configured for this service and shift. Enter the agreed amounts.";

  return (
    <div className="max-w-3xl">
      <PageHeader
        back={{ href: `/admin/leads/${request.id}/match`, label: "Matches" }}
        title={`Propose ${caregiver.fullName}`}
        description={`${request.reference} · ${SHIFT_LABELS[shift]} · ${request.locality}, ${request.city}`}
      />
      <div className="mb-5">
        <Notice tone="info">This creates a proposal only. You will record both acceptances and confirm explicitly on the next screen.</Notice>
      </div>
      <Panel>
        <AssignmentTermsForm
          action={createAssignmentAction}
          hidden={{ requestId: request.id, caregiverId: caregiver.id, replacesAssignmentId: replaces }}
          shiftType={shift}
          submitLabel="Create proposal"
          suggestion={suggestion}
          defaults={{
            startDate: toDateOnlyString(start),
            durationValue: request.durationValue,
            durationUnit: request.durationUnit,
            quotedAmount: suggestedCustomer,
            customerAmount: suggestedCustomer,
            caregiverPayout: suggestedPayout,
            commissionMethod: settings.commissionMethod,
            commissionRate: settings.commissionRate.toString(),
            commissionFixedAmount: settings.commissionFixedAmount.toString(),
            commissionBasis: settings.commissionBasis,
            staffingPlan: "",
            financialNotes: "",
          }}
        />
      </Panel>
    </div>
  );
}
