import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listLeads } from "@/lib/services/leads";
import { listOpenInquiries } from "@/lib/services/inquiries";
import { listActiveServices } from "@/lib/services/settings";
import { leadFiltersSchema } from "@/lib/validation/admin";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, PRIORITY_LABELS, CONTACT_METHOD_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, SHIFT_TYPES, fromDbShift } from "@/lib/domain/shift";
import { currentTimeMs, formatDate, formatDateTime } from "@/lib/domain/dates";
import { formatPhoneDisplay, telHref } from "@/lib/contact";
import { PageHeader } from "@/components/admin/page-header";
import { LeadStatusBadge, PriorityBadge } from "@/components/admin/status";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/ui/panel";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { InlineAction } from "@/components/admin/inline-action";
import { markInquiryHandledAction } from "@/app/admin/actions/leads";

export const metadata: Metadata = { title: "Leads" };

const VIEWS = [
  { key: undefined, label: "All" },
  { key: "open", label: "Open" },
  { key: "new", label: "New" },
  { key: "overdue", label: "Follow-up due" },
  { key: "mine", label: "Assigned to me" },
] as const;

const select = "h-10 rounded-[var(--radius-control)] border border-line-strong bg-paper px-2.5 text-sm";

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const actor = await requirePermissionPage("lead:write");
  const sp = await searchParams;
  const filters = leadFiltersSchema.parse(sp);
  const [result, services, inquiries] = await Promise.all([
    listLeads(actor, filters),
    listActiveServices(),
    can(actor, "lead:create") ? listOpenInquiries(actor) : Promise.resolve([]),
  ]);
  const now = currentTimeMs();
  const viewHref = (key?: string) => (key ? `/admin/leads?view=${key}` : "/admin/leads");

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every care request, from first contact to placement."
        actions={
          <LinkButton href="/admin/leads/new">
            <PlusIcon size={18} aria-hidden /> New lead
          </LinkButton>
        }
      />

      {inquiries.length > 0 && (
        <Panel title={`Callback requests (${inquiries.length})`} description="Sent from the contact page. Call back, then create a lead or mark as handled." className="mb-6">
          <ul className="divide-y divide-line">
            {inquiries.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy-900">
                    {q.name} ·{" "}
                    <a href={telHref(q.phone) ?? undefined} className="tabular text-teal-700 hover:underline">{formatPhoneDisplay(q.phone)}</a>
                    <span className="ml-2 text-xs font-normal text-muted">prefers {CONTACT_METHOD_LABELS[q.preferredContact].toLowerCase()}</span>
                  </p>
                  {q.message && <p className="mt-0.5 max-w-prose text-sm text-ink">{q.message}</p>}
                  <p className="text-xs text-muted">{formatDateTime(q.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/leads/new?inquiry=${q.id}`} className={buttonClass("secondary", "sm")}>Create lead</Link>
                  <InlineAction action={markInquiryHandledAction} fields={{ inquiryId: q.id }} label="Mark handled" variant="quiet" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {VIEWS.map((v) => {
          const active = filters.view === v.key;
          return (
            <Link
              key={v.label}
              href={viewHref(v.key)}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-teal-600 text-navy-900" : "border-transparent text-muted hover:text-navy-900"}`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2" role="search" aria-label="Filter leads">
        {filters.view && <input type="hidden" name="view" value={filters.view} />}
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Search
          <input name="q" defaultValue={filters.q} placeholder="Reference, name or phone" className={`${select} w-60 text-navy-950`} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Status
          <select name="status" defaultValue={filters.status ?? ""} className={select}>
            <option value="">Any</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Service
          <select name="service" defaultValue={filters.service ?? ""} className={select}>
            <option value="">Any</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Shift
          <select name="shift" defaultValue={filters.shift ?? ""} className={select}>
            <option value="">Any</option>
            {SHIFT_TYPES.map((s) => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          City
          <input name="city" defaultValue={filters.city} className={`${select} w-32 text-navy-950`} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Priority
          <select name="priority" defaultValue={filters.priority ?? ""} className={select}>
            <option value="">Any</option>
            {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Source
          <select name="source" defaultValue={filters.source ?? ""} className={select}>
            <option value="">Any</option>
            {Object.entries(LEAD_SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          From
          <input type="date" name="from" defaultValue={filters.from} className={select} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          To
          <input type="date" name="to" defaultValue={filters.to} className={select} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Sort
          <select name="sort" defaultValue={filters.sort ?? "created_desc"} className={select}>
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="followup_asc">Next follow-up</option>
          </select>
        </label>
        <button className={buttonClass("secondary", "sm", "h-10")}>Apply</button>
        <Link href={viewHref(filters.view)} className={buttonClass("quiet", "sm", "h-10")}>Clear</Link>
      </form>

      {result.rows.length === 0 ? (
        <EmptyState
          title={Object.keys(sp).length ? "No leads match these filters" : "No leads yet"}
          action={<LinkButton href="/admin/leads/new" variant="secondary">Add a phone or WhatsApp lead</LinkButton>}
        >
          Website requests appear here as soon as they are submitted.
        </EmptyState>
      ) : (
        <TableWrap caption="Leads">
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Customer</Th>
              <Th>Service</Th>
              <Th>Shift</Th>
              <Th>Area</Th>
              <Th>Status</Th>
              <Th>Follow-up</Th>
              <Th>Received</Th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => {
              const overdue = r.nextFollowUpAt && r.nextFollowUpAt.getTime() < now && !["COMPLETED", "CANCELLED", "UNFULFILLED"].includes(r.status);
              return (
                <tr key={r.id} className={r.status === "NEW" ? "bg-teal-50/40" : undefined}>
                  <Td>
                    <Link href={`/admin/leads/${r.id}`} className="tabular font-semibold text-teal-700 hover:underline">{r.reference}</Link>
                    <div className="mt-1 flex gap-1"><PriorityBadge priority={r.priority} /></div>
                  </Td>
                  <Td>
                    <div className="font-medium text-navy-900">{r.customer.name}</div>
                    <div className="tabular text-xs text-muted">{formatPhoneDisplay(r.customer.phone)}</div>
                  </Td>
                  <Td>{r.serviceCategory?.name ?? <span className="text-muted">Other: {r.otherServiceText}</span>}</Td>
                  <Td className="whitespace-nowrap">{SHIFT_LABELS[fromDbShift(r.shiftType)]}</Td>
                  <Td>{r.locality}, {r.city}</Td>
                  <Td>
                    <LeadStatusBadge status={r.status} />
                    {r.assignedTo && <div className="mt-1 text-xs text-muted">{r.assignedTo.name}</div>}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {r.nextFollowUpAt ? (
                      <span className={`inline-flex items-center gap-1 ${overdue ? "font-semibold text-rose-700" : ""}`}>
                        {overdue && <WarningCircleIcon size={16} aria-label="Overdue" />}
                        {formatDateTime(r.nextFollowUpAt)}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatDate(r.createdAt)}
                    <div className="text-xs text-muted">{LEAD_SOURCE_LABELS[r.source]}</div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} basePath="/admin/leads" params={sp} />
    </>
  );
}
