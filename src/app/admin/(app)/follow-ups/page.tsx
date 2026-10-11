import type { Metadata } from "next";
import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth/dal";
import { listFollowUps } from "@/lib/services/leads";
import { CALL_OUTCOME_LABELS, FOLLOW_UP_STATUS_LABELS } from "@/lib/domain/labels";
import { formatDateTime } from "@/lib/domain/dates";
import { formatPhoneDisplay, telHref } from "@/lib/contact";
import { PageHeader } from "@/components/admin/page-header";
import { LeadStatusBadge } from "@/components/admin/status";
import { EmptyState } from "@/components/ui/panel";
import { CompleteFollowUpForm } from "@/components/admin/lead-forms";

export const metadata: Metadata = { title: "Follow-ups" };

const TABS = [
  { key: "due", label: "Due now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "done", label: "Completed" },
] as const;

export default async function FollowUpsPage({ searchParams }: PageProps<"/admin/follow-ups">) {
  const actor = await requirePermissionPage("lead:write");
  const sp = await searchParams;
  const view = TABS.find((t) => t.key === sp.view)?.key ?? "due";
  const rows = await listFollowUps(actor, view);
  return (
    <>
      <PageHeader title="Follow-ups" description="Calls and checks you have scheduled on leads." />
      <div className="mb-4 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/follow-ups?view=${t.key}`} aria-current={view === t.key ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${view === t.key ? "border-teal-600 text-navy-900" : "border-transparent text-muted hover:text-navy-900"}`}>
            {t.label}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={view === "due" ? "Nothing is due right now" : "Nothing here"}>Schedule follow-ups from a lead page.</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {rows.map((f) => (
            <li key={f.id} className="rounded-[var(--radius-panel)] border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">
                    <Link href={`/admin/leads/${f.request.id}`} className="tabular text-teal-700 hover:underline">{f.request.reference}</Link> · {f.request.customer.name} ·{" "}
                    <a href={telHref(f.request.customer.phone) ?? undefined} className="tabular font-normal text-teal-700 hover:underline">{formatPhoneDisplay(f.request.customer.phone)}</a>
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateTime(f.dueAt)} · for {f.assignedTo?.name ?? "anyone"}
                    {f.status !== "PENDING" && ` · ${FOLLOW_UP_STATUS_LABELS[f.status]}`}
                    {f.outcome && ` · ${CALL_OUTCOME_LABELS[f.outcome]}`}
                  </p>
                  {f.notes && <p className="mt-1 text-sm text-ink">{f.notes}</p>}
                </div>
                <LeadStatusBadge status={f.request.status} />
              </div>
              {f.status === "PENDING" && <div className="mt-3 border-t border-line pt-3"><CompleteFollowUpForm followUpId={f.id} requestId={f.request.id} /></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
