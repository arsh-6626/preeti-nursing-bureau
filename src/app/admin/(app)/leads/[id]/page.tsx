import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneIcon, UsersThreeIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can, NotFoundError } from "@/lib/auth/permissions";
import { getLeadDetail, listActiveTeam } from "@/lib/services/leads";
import { LEAD_TRANSITIONS } from "@/lib/domain/lead-status";
import {
  ARRANGEMENT_LABELS,
  CALL_OUTCOME_LABELS,
  CONTACT_METHOD_LABELS,
  DURATION_UNIT_LABELS,
  GENDER_PREF_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  MOBILITY_LABELS,
  SHIFT_TIMING_LABELS,
  FOLLOW_UP_STATUS_LABELS,
} from "@/lib/domain/labels";
import { SHIFT_LABELS, fromDbShift } from "@/lib/domain/shift";
import { currentTimeMs, formatDate, formatDateTime, computeEndDate } from "@/lib/domain/dates";
import { formatINR } from "@/lib/domain/money";
import { formatPhoneDisplay, telHref, whatsappHref } from "@/lib/contact";
import { PageHeader } from "@/components/admin/page-header";
import { AssignmentStatusBadge, LeadStatusBadge, PriorityBadge } from "@/components/admin/status";
import { DefinitionList, EmptyState, Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { CallForm, CompleteFollowUpForm, FollowUpForm, LeadMetaForm, NoteForm, StatusForm } from "@/components/admin/lead-forms";
import { InlineAction } from "@/components/admin/inline-action";
import { cancelFollowUpAction } from "@/app/admin/actions/leads";

export const metadata: Metadata = { title: "Lead" };

function defaultDueValue(hours: number) {
  const ist = new Date(Date.now() + hours * 3_600_000 + 5.5 * 3_600_000);
  return ist.toISOString().slice(0, 16);
}

export default async function LeadDetailPage({ params }: PageProps<"/admin/leads/[id]">) {
  const actor = await requirePermissionPage("lead:write");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const lead = await getLeadDetail(actor, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const team = await listActiveTeam(actor);
  const shift = fromDbShift(lead.shiftType);
  const endDate = computeEndDate(lead.startDate, lead.durationValue, lead.durationUnit);
  const tel = telHref(lead.customer.phone);
  const wa = whatsappHref(lead.customer.phone, `Hello ${lead.customer.name}, this is Preeti Nursing Bureau about your request ${lead.reference}.`);
  const canMatch = can(actor, "assignment:write");
  const now = currentTimeMs();
  const closed = ["COMPLETED", "CANCELLED", "UNFULFILLED"].includes(lead.status);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/leads", label: "Leads" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tabular">{lead.reference}</span>
            <LeadStatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </span>
        }
        description={`Received ${formatDateTime(lead.createdAt)} via ${LEAD_SOURCE_LABELS[lead.source].toLowerCase()}`}
        actions={
          <>
            {tel && <a href={tel} className={buttonClass("secondary", "sm")}><PhoneIcon size={16} aria-hidden /> Call</a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><WhatsappLogoIcon size={16} aria-hidden /> WhatsApp</a>}
            {canMatch && !closed && (
              <LinkButton href={`/admin/leads/${lead.id}/match`} size="sm">
                <UsersThreeIcon size={16} aria-hidden /> Find caregivers
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid min-w-0 gap-6">
          <Panel title="Customer">
            <DefinitionList
              items={[
                ["Name", <Link key="n" href={`/admin/customers/${lead.customer.id}`} className="font-medium text-teal-700 hover:underline">{lead.customer.name}</Link>],
                ["Mobile", <span key="p" className="tabular">{formatPhoneDisplay(lead.customer.phone)}</span>],
                ["Email", lead.customer.email ?? "-"],
                ["Relationship", lead.customer.relationship ?? "-"],
                ["Prefers", CONTACT_METHOD_LABELS[lead.customer.preferredContact]],
                ["Consent", `Given ${formatDateTime(lead.consentAt)}`],
              ]}
            />
          </Panel>

          <Panel title="Care requirements">
            <DefinitionList
              items={[
                ["Service", lead.serviceCategory ? <span key="s">{lead.serviceCategory.name} {lead.serviceCategory.isNursing && <Badge tone="teal">Nursing</Badge>}</span> : `Other: ${lead.otherServiceText}`],
                ["Shift", <strong key="sh" className="font-semibold text-navy-900">{SHIFT_LABELS[shift]}</strong>],
                ["Day / night", shift === "12_HOURS" ? SHIFT_TIMING_LABELS[lead.shiftTiming] : "Not applicable (24-hour)"],
                ["Dates", `${formatDate(lead.startDate)} to ${formatDate(endDate)} (${lead.durationValue} ${DURATION_UNIT_LABELS[lead.durationUnit]})`],
                ["Arrangement", ARRANGEMENT_LABELS[lead.arrangementType]],
                ["Mobility", MOBILITY_LABELS[lead.mobility]],
                ["Care needed", <span key="c" className="whitespace-pre-line">{lead.careDescription}</span>],
                ["Gender preference", GENDER_PREF_LABELS[lead.preferredGender]],
                ["Nursing tasks", lead.nursingSkillsRequired ?? "-"],
                ["Other needs", lead.additionalRequirements ?? "-"],
                ["Location", `${lead.locality}, ${lead.city} ${lead.pincode}${lead.serviceArea ? "" : " (locality not in listed areas)"}`],
                ["Address", lead.address ?? "-"],
                ["Last call", lead.lastCallOutcome ? CALL_OUTCOME_LABELS[lead.lastCallOutcome] : "-"],
                ...(lead.closedReason ? ([["Closed because", lead.closedReason]] as [string, string][]) : []),
              ]}
            />
          </Panel>

          <Panel
            title="Assignments"
            actions={canMatch && !closed ? <LinkButton href={`/admin/leads/${lead.id}/match`} size="sm" variant="secondary">Propose caregiver</LinkButton> : null}
          >
            {lead.assignments.length === 0 ? (
              <EmptyState title="No caregiver proposed yet">Use “Find caregivers” to see suitable matches.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {lead.assignments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <Link href={`/admin/assignments/${a.id}`} className="font-semibold text-teal-700 hover:underline">
                        {a.caregiver.fullName} <span className="tabular text-muted">({a.caregiver.code})</span>
                      </Link>
                      <p className="text-sm text-muted">
                        {SHIFT_LABELS[fromDbShift(a.shiftType)]} · {formatDate(a.startDate)} to {formatDate(a.endDate)}
                        {a.replacesAssignmentId && " · replacement"}
                        {"customerAmount" in a && a.customerAmount != null && ` · ${formatINR(a.customerAmount)}`}
                      </p>
                      {a.cancellationReason && <p className="text-sm text-rose-700">Cancelled: {a.cancellationReason}</p>}
                    </div>
                    <AssignmentStatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Notes" description="Private to the bureau team.">
            <NoteForm requestId={lead.id} />
            {lead.notes.length > 0 && (
              <ul className="mt-5 grid gap-3 border-t border-line pt-4">
                {lead.notes.map((n) => (
                  <li key={n.id} className="rounded-[var(--radius-control)] bg-mist px-4 py-3">
                    <p className="whitespace-pre-line text-sm text-ink">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">{n.author.name} · {formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Status history">
            <ol className="grid gap-3">
              {lead.statusChanges.map((c) => (
                <li key={c.id} className="flex gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-teal-600" />
                  <div>
                    <p className="text-ink">
                      {c.fromStatus ? `${LEAD_STATUS_LABELS[c.fromStatus]} → ` : ""}
                      <strong className="font-semibold text-navy-900">{LEAD_STATUS_LABELS[c.toStatus]}</strong>
                      {c.note && <span className="text-muted"> · {c.note}</span>}
                    </p>
                    <p className="text-xs text-muted">{c.changedBy?.name ?? "System / website"} · {formatDateTime(c.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="grid h-fit gap-6">
          <Panel title="Update status">
            <StatusForm requestId={lead.id} allowed={[...LEAD_TRANSITIONS[lead.status]]} />
          </Panel>
          <Panel title="Log a call">
            <CallForm requestId={lead.id} />
          </Panel>
          <Panel title="Follow-ups">
            {lead.followUps.filter((f) => f.status === "PENDING").map((f) => (
              <div key={f.id} className={`mb-4 rounded-[var(--radius-control)] border p-3 ${f.dueAt.getTime() < now ? "border-rose-700/30 bg-rose-50" : "border-line"}`}>
                <p className="text-sm font-semibold text-navy-900">{formatDateTime(f.dueAt)}{f.dueAt.getTime() < now && <span className="text-rose-700"> · overdue</span>}</p>
                <p className="text-xs text-muted">For {f.assignedTo?.name ?? "anyone"}{f.notes ? ` · ${f.notes}` : ""}</p>
                <div className="mt-2"><CompleteFollowUpForm followUpId={f.id} requestId={lead.id} /></div>
                <div className="mt-2"><InlineAction action={cancelFollowUpAction} fields={{ followUpId: f.id, requestId: lead.id }} label="Cancel follow-up" variant="quiet" /></div>
              </div>
            ))}
            {!closed && (
              <FollowUpForm requestId={lead.id} defaultDue={defaultDueValue(24)} team={team} canAssign={can(actor, "lead:assign")} selfId={actor.id} />
            )}
            {lead.followUps.some((f) => f.status !== "PENDING") && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer list-none font-medium text-muted hover:underline [&::-webkit-details-marker]:hidden">Past follow-ups</summary>
                <ul className="mt-2 grid gap-2">
                  {lead.followUps.filter((f) => f.status !== "PENDING").map((f) => (
                    <li key={f.id} className="text-ink">
                      {formatDateTime(f.dueAt)} · {FOLLOW_UP_STATUS_LABELS[f.status]}
                      {f.outcome && ` · ${CALL_OUTCOME_LABELS[f.outcome]}`}
                      {f.notes && <span className="block text-xs text-muted">{f.notes}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Panel>
          <Panel title="Lead details">
            <LeadMetaForm
              requestId={lead.id}
              priority={lead.priority}
              source={lead.source}
              assignedToId={lead.assignedTo?.id ?? null}
              team={team}
              canAssign={can(actor, "lead:assign")}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
