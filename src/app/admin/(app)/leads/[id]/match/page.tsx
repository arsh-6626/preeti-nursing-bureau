import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircleIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/permissions";
import { getCandidates } from "@/lib/services/assignments";
import { SHIFT_LABELS, fromDbShift } from "@/lib/domain/shift";
import { GENDER_LABELS, GENDER_PREF_LABELS } from "@/lib/domain/labels";
import { formatDate } from "@/lib/domain/dates";
import { PageHeader } from "@/components/admin/page-header";
import { AvailabilityBadge, VerificationBadge } from "@/components/admin/status";
import { EmptyState, Notice } from "@/components/ui/panel";
import { LinkButton, buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Find caregivers" };

export default async function MatchPage({ params, searchParams }: PageProps<"/admin/leads/[id]/match">) {
  const actor = await requirePermissionPage("assignment:write");
  const { id } = await params;
  const sp = await searchParams;
  const replaces = typeof sp.replaces === "string" && /^[0-9a-f-]{36}$/i.test(sp.replaces) ? sp.replaces : undefined;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { request, candidates } = await getCandidates(actor, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const showBlocked = sp.all === "1";
  const eligible = candidates.filter((c) => c.eligible);
  const blocked = candidates.filter((c) => !c.eligible);
  const shown = showBlocked ? candidates : eligible;

  return (
    <>
      <PageHeader
        back={{ href: `/admin/leads/${request.id}`, label: request.reference }}
        title="Find caregivers"
        description={
          <>
            {request.serviceCategory?.name ?? `Other: ${request.otherServiceText}`} · <strong>{SHIFT_LABELS[fromDbShift(request.shiftType)]}</strong> ·{" "}
            {request.locality}, {request.city} · {formatDate(request.startDate)} to {formatDate(request.endDate)} · {GENDER_PREF_LABELS[request.preferredGender]}
          </>
        }
      />
      <div className="mb-5 grid gap-3">
        <Notice tone="info">
          The ranking is a sorting aid, not a decision. Check each caregiver yourself, speak to the family and the
          caregiver, and confirm the assignment explicitly once both agree.
        </Notice>
        {replaces && <Notice tone="warning">You are choosing a replacement caregiver for an existing assignment.</Notice>}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {eligible.length} available match{eligible.length === 1 ? "" : "es"}, {blocked.length} not possible for these dates or shift.
        </p>
        <Link href={showBlocked ? `?${replaces ? `replaces=${replaces}` : ""}` : `?all=1${replaces ? `&replaces=${replaces}` : ""}`} className={buttonClass("quiet", "sm")}>
          {showBlocked ? "Hide unavailable caregivers" : "Show unavailable caregivers too"}
        </Link>
      </div>
      {shown.length === 0 ? (
        <EmptyState
          title="No suitable caregiver is available"
          action={<LinkButton href="/admin/caregivers/new" variant="secondary">Add a caregiver</LinkButton>}
        >
          Nobody active supports this shift and is free on these dates. Consider calling the family about other dates, or mark the lead unfulfilled.
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {shown.map((c) => (
            <li key={c.caregiver.id} className={`rounded-[var(--radius-panel)] border p-5 ${c.eligible ? "border-line" : "border-line bg-mist/60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/caregivers/${c.caregiver.id}`} className="text-base font-semibold text-navy-900 hover:text-teal-700">
                      {c.caregiver.fullName}
                    </Link>
                    <span className="tabular text-sm text-muted">{c.caregiver.code}</span>
                    <VerificationBadge status={c.caregiver.verificationStatus} />
                    <AvailabilityBadge status={c.caregiver.availabilityStatus} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {GENDER_LABELS[c.caregiver.gender]} · {c.caregiver.experienceYears} yrs experience · Shifts: {c.caregiver.supportedShifts.map((s) => SHIFT_LABELS[s]).join(", ")}
                    {c.caregiver.languages.length > 0 && ` · ${c.caregiver.languages.join(", ")}`}
                  </p>
                  {c.caregiver.qualifications && <p className="mt-1 text-sm text-ink">{c.caregiver.qualifications}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm text-muted" title="Sorting score out of 100">Fit {c.score}</span>
                  {c.eligible ? (
                    <LinkButton href={`/admin/assignments/new?request=${request.id}&caregiver=${c.caregiver.id}${replaces ? `&replaces=${replaces}` : ""}`} size="sm">
                      Propose
                    </LinkButton>
                  ) : (
                    <span className="text-sm font-semibold text-rose-700">Cannot be assigned</span>
                  )}
                </div>
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                {c.checks.map((check) => (
                  <li key={check.label} className={`flex items-center gap-1.5 text-sm ${check.ok ? "text-ink" : check.hard ? "text-rose-700" : "text-amber-700"}`}>
                    {check.ok ? (
                      <CheckCircleIcon size={16} weight="fill" className="text-leaf-600" aria-label="Met" />
                    ) : check.hard ? (
                      <XCircleIcon size={16} weight="fill" aria-label="Blocking" />
                    ) : (
                      <WarningIcon size={16} weight="fill" aria-label="Not met" />
                    )}
                    {check.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
