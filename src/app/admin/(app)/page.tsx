import type { Metadata } from "next";
import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { getDashboard, resolveRange } from "@/lib/services/reports";
import { getSettings } from "@/lib/services/settings";
import { formatINR, money } from "@/lib/domain/money";
import { formatDate } from "@/lib/domain/dates";
import { PageHeader } from "@/components/admin/page-header";
import { Notice } from "@/components/ui/panel";
import { buttonClass } from "@/components/ui/button";
import { CategoryBarChart, ConversionChart, LeadsByMonthChart, MoneyChart, OutcomesChart } from "@/components/admin/charts";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value, href, hint, emphasis }: { label: string; value: string | number; href?: string; hint?: string; emphasis?: boolean }) {
  const body = (
    <>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`tabular mt-1 text-2xl font-semibold tracking-tight ${emphasis ? "text-teal-700" : "text-navy-900"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-paper p-4 transition-colors hover:bg-mist">{body}</Link>
  ) : (
    <div className="bg-paper p-4">{body}</div>
  );
}

function StatGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-navy-900">{title}</h2>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-panel)] border border-line bg-line md:grid-cols-4">{children}</div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const actor = await requirePermissionPage("lead:write");
  const sp = await searchParams;
  const range = resolveRange(typeof sp.from === "string" ? sp.from : undefined, typeof sp.to === "string" ? sp.to : undefined);
  const showReports = can(actor, "reports:read");
  const [dash, settings, caregiverCount, pricingCount] = await Promise.all([
    showReports ? getDashboard(actor, range) : null,
    getSettings(),
    db.caregiver.count({ where: { archivedAt: null } }),
    db.pricingRule.count(),
  ]);
  const setup = [
    !settings.phone && { text: "Add the bureau's telephone number", href: "/admin/settings#business" },
    !settings.whatsapp && { text: "Add the WhatsApp number", href: "/admin/settings#business" },
    caregiverCount === 0 && { text: "Add the caregivers you work with", href: "/admin/caregivers/new" },
    pricingCount === 0 && { text: "Set indicative pricing for 12-hour and 24-hour care", href: "/admin/settings#pricing" },
  ].filter((x): x is { text: string; href: string } => Boolean(x));

  return (
    <>
      <PageHeader
        title={`Hello, ${actor.name.split(" ")[0]}`}
        description={showReports ? `Showing ${formatDate(range.from)} to ${formatDate(range.to)}. Counts marked “now” ignore the date range.` : "Your assigned leads and follow-ups."}
        actions={
          showReports ? (
            <form method="get" className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">From<input type="date" name="from" defaultValue={range.fromStr} className="h-10 rounded-[var(--radius-control)] border border-line-strong px-2.5 text-sm text-navy-950" /></label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">To<input type="date" name="to" defaultValue={range.toStr} className="h-10 rounded-[var(--radius-control)] border border-line-strong px-2.5 text-sm text-navy-950" /></label>
              <button className={buttonClass("secondary", "sm", "h-10")}>Apply</button>
            </form>
          ) : null
        }
      />

      {setup.length > 0 && can(actor, "settings:write") && (
        <div className="mb-6">
          <Notice tone="warning">
            <p className="font-semibold">Finish setting up</p>
            <ul className="mt-1 list-inside list-disc">
              {setup.map((s) => <li key={s.text}><Link href={s.href} className="underline">{s.text}</Link></li>)}
            </ul>
          </Notice>
        </div>
      )}

      {!dash ? (
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/leads?view=mine" className={buttonClass("primary")}>My leads</Link>
          <Link href="/admin/follow-ups" className={buttonClass("secondary")}>Follow-ups due</Link>
        </div>
      ) : (
        <div className="grid gap-8">
          <StatGroup title="Leads">
            <Stat label="New leads in period" value={dash.cards.newLeadsInRange} href="/admin/leads" />
            <Stat label="Waiting for first call (now)" value={dash.cards.newLeadsOpen} href="/admin/leads?view=new" emphasis={dash.cards.newLeadsOpen > 0} />
            <Stat label="Follow-up due (now)" value={dash.cards.awaitingFollowUp} href="/admin/leads?view=overdue" emphasis={dash.cards.awaitingFollowUp > 0} />
            <Stat label="Requests cancelled in period" value={dash.cards.cancelledInRange} href="/admin/leads?status=CANCELLED" />
          </StatGroup>
          <StatGroup title="Placements">
            <Stat label="Confirmed, not started (now)" value={dash.cards.confirmedAssignments} href="/admin/assignments?status=CONFIRMED" />
            <Stat label="Active (now)" value={dash.cards.activeAssignments} href="/admin/assignments?status=ACTIVE" />
            <Stat label="Completed in period" value={dash.cards.completedInRange} href="/admin/assignments?status=COMPLETED" />
            <Stat label="Caregivers on file" value={caregiverCount} href="/admin/caregivers" />
          </StatGroup>
          {dash.finance && (
            <StatGroup title="Money">
              <Stat label="Gross billing (confirmed in period)" value={formatINR(dash.finance.grossBilling)} hint="Agreed customer charges" />
              <Stat label="Customer collections in period" value={formatINR(dash.finance.collections)} hint="Money received, net of refunds" />
              <Stat label="Outstanding from customers (now)" value={formatINR(dash.finance.outstandingCustomer)} href="/admin/finance" />
              <Stat label="Commission earned in period" value={formatINR(dash.finance.commissionInRange)} hint="Under the configured policy" emphasis />
              <Stat label="Caregiver payout obligations" value={formatINR(dash.finance.payoutObligations)} hint="Confirmed in period" />
              <Stat label="Paid to caregivers in period" value={formatINR(dash.finance.caregiverPaidInRange)} />
              <Stat label="Owed to caregivers (now)" value={formatINR(dash.finance.outstandingCaregiver)} href="/admin/finance" />
              <Stat label="Margin on confirmed (info)" value={formatINR(money(dash.finance.grossBilling).minus(money(dash.finance.payoutObligations)))} hint="Billing minus payouts. Not commission." />
            </StatGroup>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <LeadsByMonthChart data={dash.charts.leadsByMonth} />
            <ConversionChart data={dash.charts.conversion} />
            <CategoryBarChart title="Leads by service" data={dash.charts.leadsByService} />
            <CategoryBarChart title="Lead sources" data={dash.charts.leadsBySource} color="#2c6e6a" />
            <CategoryBarChart title="Shift requested: 12 hours vs 24 hours" data={dash.charts.shiftDistribution} />
            <OutcomesChart data={dash.charts.assignmentOutcomes} />
            {dash.finance && <div className="lg:col-span-2"><MoneyChart data={dash.finance.monthly} /></div>}
          </div>
        </div>
      )}
    </>
  );
}
