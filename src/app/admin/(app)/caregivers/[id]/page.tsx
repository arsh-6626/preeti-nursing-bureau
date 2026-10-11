import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can, NotFoundError } from "@/lib/auth/permissions";
import { getCaregiverDetail } from "@/lib/services/caregivers";
import { AFFILIATION_LABELS, AVAILABILITY_KIND_LABELS, GENDER_LABELS, RATE_PERIOD_LABELS, VERIFICATION_TYPE_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, fromDbShift } from "@/lib/domain/shift";
import { formatDate, formatDateTime, toDateOnlyString } from "@/lib/domain/dates";
import { formatINR } from "@/lib/domain/money";
import { formatPhoneDisplay, telHref } from "@/lib/contact";
import { PageHeader } from "@/components/admin/page-header";
import { AssignmentStatusBadge, AvailabilityBadge, VerificationBadge } from "@/components/admin/status";
import { DefinitionList, EmptyState, Notice, Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { InlineAction } from "@/components/admin/inline-action";
import { AddVerificationForm, AvailabilityForm, CaregiverNoteForm, OverallVerificationForm, UpdateVerificationForm } from "@/components/admin/caregiver-detail-forms";
import { archiveCaregiverAction, removeAvailabilityAction } from "@/app/admin/actions/caregivers";

export const metadata: Metadata = { title: "Caregiver" };

export default async function CaregiverPage({ params, searchParams }: PageProps<"/admin/caregivers/[id]">) {
  const actor = await requirePermissionPage("caregiver:read");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getCaregiverDetail(actor, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const canWrite = can(actor, "caregiver:write");
  const canVerify = can(actor, "caregiver:verification");
  const today = new Date();
  return (
    <>
      <PageHeader
        back={{ href: "/admin/caregivers", label: "Caregivers" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.fullName} <span className="tabular text-base font-normal text-muted">{c.code}</span>
            <VerificationBadge status={c.verificationStatus} />
            <AvailabilityBadge status={c.availabilityStatus} />
            {c.archivedAt && <Badge tone="rose">Archived</Badge>}
          </span>
        }
        description={`Added ${formatDate(c.createdAt)} · updated ${formatDateTime(c.updatedAt)}`}
        actions={
          canWrite ? (
            <>
              <LinkButton href={`/admin/caregivers/${c.id}/edit`} size="sm" variant="secondary"><PencilSimpleIcon size={16} aria-hidden /> Edit</LinkButton>
              <InlineAction
                action={archiveCaregiverAction}
                fields={{ caregiverId: c.id, archive: c.archivedAt ? "0" : "1" }}
                label={c.archivedAt ? "Restore" : "Archive"}
                variant={c.archivedAt ? "secondary" : "danger"}
                confirm={c.archivedAt ? undefined : { title: "Archive this caregiver?", body: "They will no longer appear in matching. All history, assignments and payments are kept.", confirmLabel: "Archive" }}
              />
            </>
          ) : null
        }
      />
      {sp.saved === "1" && <div className="mb-4"><Notice tone="success">Caregiver saved.</Notice></div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid min-w-0 gap-6">
          <Panel title="Profile">
            <DefinitionList
              items={[
                ["Mobile", <a key="p" href={telHref(c.phone) ?? undefined} className="tabular text-teal-700 hover:underline">{formatPhoneDisplay(c.phone)}</a>],
                ["Email", c.email ?? "-"],
                ["Gender", GENDER_LABELS[c.gender]],
                ["Experience", `${c.experienceYears} years`],
                ["Languages", c.languages.join(", ") || "-"],
                ["Services", c.services.map((s) => s.serviceCategory.name).join(", ") || "-"],
                ["Skills", c.skills.join(", ") || "-"],
                ["Qualifications", c.qualifications ?? "-"],
                ["Shift types", <strong key="s" className="font-semibold">{c.supportedShifts.map((s) => SHIFT_LABELS[fromDbShift(s)]).join(", ")}</strong>],
                ["Preferred areas", c.areas.map((a) => `${a.serviceArea.locality}, ${a.serviceArea.city}`).join("; ") || "-"],
                ["Affiliation", `${AFFILIATION_LABELS[c.affiliation]}${c.agencyName ? ` (${c.agencyName})` : ""}`],
                ...("payout12h" in c
                  ? ([
                      ["Payout, 12-hour", c.payout12h ? `${formatINR(c.payout12h)} ${RATE_PERIOD_LABELS[c.payoutPeriod!]}` : "-"],
                      ["Payout, 24-hour", c.payout24h ? `${formatINR(c.payout24h)} ${RATE_PERIOD_LABELS[c.payoutPeriod!]}` : "-"],
                    ] as [string, string][])
                  : []),
              ]}
            />
          </Panel>

          {canVerify && c.verifications && (
            <Panel title="Verification" description="Restricted to administrators. A profile is never verified automatically.">
              <OverallVerificationForm caregiverId={c.id} status={c.verificationStatus} />
              <div className="mt-5 border-t border-line pt-4">
                {c.verifications.length === 0 ? (
                  <p className="text-sm text-muted">No checks recorded yet.</p>
                ) : (
                  <ul className="grid gap-3">
                    {c.verifications.map((v) => {
                      const expired = v.expiresAt && v.expiresAt < today;
                      return (
                        <li key={v.id} className="rounded-[var(--radius-control)] border border-line p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-navy-900">{VERIFICATION_TYPE_LABELS[v.type]}</span>
                            <span className="flex gap-2"><VerificationBadge status={v.status} />{expired && <Badge tone="rose">Document expired</Badge>}</span>
                          </div>
                          <p className="mt-1 text-sm text-ink">{v.documentRef ?? "No document described"}</p>
                          <p className="text-xs text-muted">
                            {v.expiresAt ? `Expires ${formatDate(v.expiresAt)} · ` : ""}
                            {v.verifiedAt ? `Reviewed ${formatDateTime(v.verifiedAt)} by ${v.reviewedBy?.name ?? "-"}` : "Not reviewed yet"}
                          </p>
                          {v.notes && <p className="mt-1 text-xs text-muted">{v.notes}</p>}
                          <div className="mt-2">
                            <UpdateVerificationForm recordId={v.id} caregiverId={c.id} status={v.status} documentRef={v.documentRef ?? ""} expiresAt={v.expiresAt ? toDateOnlyString(v.expiresAt) : ""} notes={v.notes ?? ""} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <h3 className="mb-3 mt-6 text-sm font-semibold text-navy-900">Record a check</h3>
                <AddVerificationForm caregiverId={c.id} />
              </div>
            </Panel>
          )}

          <Panel title="Assignments">
            {c.assignments.length === 0 ? (
              <EmptyState title="No assignments yet" />
            ) : (
              <ul className="divide-y divide-line">
                {c.assignments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <Link href={`/admin/assignments/${a.id}`} className="tabular font-semibold text-teal-700 hover:underline">{a.request.reference}</Link>
                      <span className="text-muted"> · {a.request.customer.name} · {SHIFT_LABELS[fromDbShift(a.shiftType)]} · {formatDate(a.startDate)} to {formatDate(a.endDate)}</span>
                    </div>
                    <AssignmentStatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {canVerify && c.notes && (
            <Panel title="Internal notes">
              <CaregiverNoteForm caregiverId={c.id} />
              <ul className="mt-4 grid gap-3">
                {c.notes.map((n) => (
                  <li key={n.id} className="rounded-[var(--radius-control)] bg-mist px-4 py-3 text-sm">
                    <p className="whitespace-pre-line text-ink">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">{n.author.name} · {formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel title="Availability periods" description="Temporary unavailability and availability windows are checked before any confirmation." className="h-fit">
          {c.availability.length === 0 ? (
            <p className="text-sm text-muted">No periods recorded. The caregiver is treated as available unless booked or marked unavailable.</p>
          ) : (
            <ul className="grid gap-2">
              {c.availability.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-2 rounded-[var(--radius-control)] border border-line p-3 text-sm">
                  <div>
                    <p className="font-semibold text-navy-900">{AVAILABILITY_KIND_LABELS[p.kind]}</p>
                    <p className="text-muted">{formatDate(p.startDate)} to {p.endDate ? formatDate(p.endDate) : "open-ended"}{p.reason ? ` · ${p.reason}` : ""}</p>
                  </div>
                  {canWrite && <InlineAction action={removeAvailabilityAction} fields={{ availabilityId: p.id, caregiverId: c.id }} label="Remove" variant="quiet" />}
                </li>
              ))}
            </ul>
          )}
          {canWrite && <div className="mt-5 border-t border-line pt-4"><AvailabilityForm caregiverId={c.id} /></div>}
        </Panel>
      </div>
    </>
  );
}
