import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listCaregivers, parseCaregiverFilters } from "@/lib/services/caregivers";
import { listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { AVAILABILITY_LABELS, VERIFICATION_STATUS_LABELS, GENDER_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, SHIFT_TYPES, fromDbShift } from "@/lib/domain/shift";
import { formatPhoneDisplay } from "@/lib/contact";
import { PageHeader } from "@/components/admin/page-header";
import { AvailabilityBadge, VerificationBadge } from "@/components/admin/status";
import { EmptyState } from "@/components/ui/panel";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { LinkButton, buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Caregivers" };
const select = "h-10 rounded-[var(--radius-control)] border border-line-strong bg-paper px-2.5 text-sm";

export default async function CaregiversPage({ searchParams }: PageProps<"/admin/caregivers">) {
  const actor = await requirePermissionPage("caregiver:read");
  const sp = await searchParams;
  const filters = parseCaregiverFilters(sp);
  const [result, services, areas] = await Promise.all([listCaregivers(actor, filters), listActiveServices(), listActiveAreas()]);
  return (
    <>
      <PageHeader
        title="Caregivers"
        description="Profiles are entered by the bureau. New profiles always start unverified."
        actions={can(actor, "caregiver:write") ? <LinkButton href="/admin/caregivers/new"><PlusIcon size={18} aria-hidden /> Add caregiver</LinkButton> : null}
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Search<input name="q" defaultValue={filters.q} placeholder="Name, ID or phone" className={`${select} w-52 text-navy-950`} /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Service
          <select name="service" defaultValue={filters.service ?? ""} className={select}><option value="">Any</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Area
          <select name="area" defaultValue={filters.area ?? ""} className={select}><option value="">Any</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.locality}, {a.city}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Shift
          <select name="shift" defaultValue={filters.shift ?? ""} className={select}><option value="">Any</option>{SHIFT_TYPES.map((s) => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Availability
          <select name="availability" defaultValue={filters.availability ?? ""} className={select}><option value="">Any</option>{Object.entries(AVAILABILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Verification
          <select name="verification" defaultValue={filters.verification ?? ""} className={select}><option value="">Any</option>{Object.entries(VERIFICATION_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-sm"><input type="checkbox" name="archived" value="1" defaultChecked={filters.archived} className="accent-teal-600" /> Archived</label>
        <button className={buttonClass("secondary", "sm", "h-10")}>Apply</button>
        <Link href="/admin/caregivers" className={buttonClass("quiet", "sm", "h-10")}>Clear</Link>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState
          title={Object.keys(sp).length ? "No caregivers match these filters" : "No caregivers yet"}
          action={can(actor, "caregiver:write") ? <LinkButton href="/admin/caregivers/new" variant="secondary">Add the first caregiver</LinkButton> : undefined}
        >
          Add the caregivers you work with so they can be matched to requests.
        </EmptyState>
      ) : (
        <TableWrap caption="Caregivers">
          <thead><tr><Th>Caregiver</Th><Th>Services</Th><Th>Shifts</Th><Th>Areas</Th><Th>Availability</Th><Th>Verification</Th></tr></thead>
          <tbody>
            {result.rows.map((c) => (
              <tr key={c.id}>
                <Td>
                  <Link href={`/admin/caregivers/${c.id}`} className="font-semibold text-teal-700 hover:underline">{c.fullName}</Link>
                  <div className="tabular text-xs text-muted">{c.code} · {formatPhoneDisplay(c.phone)} · {GENDER_LABELS[c.gender]} · {c.experienceYears} yrs</div>
                </Td>
                <Td className="max-w-56 text-xs">{c.services.map((s) => s.serviceCategory.name).join(", ") || "-"}</Td>
                <Td className="whitespace-nowrap">{c.supportedShifts.map((s) => SHIFT_LABELS[fromDbShift(s)]).join(", ")}</Td>
                <Td className="max-w-56 text-xs">{c.areas.map((a) => a.serviceArea.locality).join(", ") || "-"}</Td>
                <Td><AvailabilityBadge status={c.availabilityStatus} /></Td>
                <Td><VerificationBadge status={c.verificationStatus} /></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} basePath="/admin/caregivers" params={sp} />
    </>
  );
}
