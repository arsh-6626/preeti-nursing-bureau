import Link from "next/link";
import { PlusIcon, UserIcon } from "@phosphor-icons/react/ssr";
import type { Actor } from "@/lib/auth/permissions";
import { can } from "@/lib/auth/permissions";
import { listCaregivers, parseCaregiverFilters } from "@/lib/services/caregivers";
import { listActiveAreas, listActiveServices, listLivingAreas } from "@/lib/services/settings";
import { AVAILABILITY_LABELS, VERIFICATION_STATUS_LABELS, GENDER_LABELS } from "@/lib/domain/labels";
import { SHIFT_LABELS, SHIFT_TYPES, fromDbShift } from "@/lib/domain/shift";
import { DELHI, STAFF, summariseWorkAreas, type StaffKind } from "@/lib/domain/staff";
import { formatPhoneDisplay } from "@/lib/contact";
import { staffFileUrl } from "@/lib/staff-files";
import { PageHeader } from "@/components/admin/page-header";
import { AvailabilityBadge, VerificationBadge } from "@/components/admin/status";
import { EmptyState } from "@/components/ui/panel";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { LinkButton, buttonClass } from "@/components/ui/button";

const select = "h-10 rounded-[var(--radius-control)] border border-line-strong bg-paper px-2.5 text-sm";

/** List of caregivers or nurses. The two are separate records with separate lists. */
export async function StaffListPage({ kind, actor, sp }: { kind: StaffKind; actor: Actor; sp: Record<string, string | string[] | undefined> }) {
  const meta = STAFF[kind];
  const filters = parseCaregiverFilters(kind, sp);
  const [result, services, areas, livingAreas] = await Promise.all([
    listCaregivers(actor, filters),
    listActiveServices(),
    listActiveAreas(),
    listLivingAreas(actor, { includeInactive: true }),
  ]);
  const newHref = `${meta.listPath}/new`;
  const delhiTotal = areas.filter((a) => a.city === DELHI).length;
  const single = meta.label.toLowerCase();
  return (
    <>
      <PageHeader
        title={meta.plural}
        description="Profiles are entered by the bureau. New profiles always start unverified."
        actions={can(actor, "caregiver:write") ? <LinkButton href={newHref}><PlusIcon size={18} aria-hidden /> Add {single}</LinkButton> : null}
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Search<input name="q" defaultValue={filters.q} placeholder="Name, ID or phone" className={`${select} w-52 text-navy-950`} /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Lives in
          <select name="livingArea" defaultValue={filters.livingArea ?? ""} className={select}><option value="">Any</option>{livingAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Service
          <select name="service" defaultValue={filters.service ?? ""} className={select}><option value="">Any</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Works in
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
        <Link href={meta.listPath} className={buttonClass("quiet", "sm", "h-10")}>Clear</Link>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState
          title={Object.keys(sp).length ? `No ${meta.plural.toLowerCase()} match these filters` : `No ${meta.plural.toLowerCase()} yet`}
          action={can(actor, "caregiver:write") ? <LinkButton href={newHref} variant="secondary">Add the first {single}</LinkButton> : undefined}
        >
          Add the {meta.plural.toLowerCase()} you work with so they can be matched to requests.
        </EmptyState>
      ) : (
        <TableWrap caption={meta.plural}>
          <thead><tr><Th>{meta.label}</Th><Th>Lives in</Th><Th>Services</Th><Th>Shifts</Th><Th>Can work in</Th><Th>Availability</Th><Th>Verification</Th></tr></thead>
          <tbody>
            {result.rows.map((c) => {
              const photo = c.files[0];
              const workIn = summariseWorkAreas(c.areas.map((a) => a.serviceArea), c.workCities, delhiTotal);
              return (
                <tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-teal-50 text-teal-700">
                        {/* eslint-disable-next-line @next/next/no-img-element -- served by an authenticated admin route */}
                        {photo ? <img src={staffFileUrl(c.id, "photo", photo.createdAt)} alt="" className="size-full object-cover" loading="lazy" /> : <UserIcon size={18} aria-hidden />}
                      </span>
                      <div>
                        <Link href={`/admin/caregivers/${c.id}`} className="font-semibold text-teal-700 hover:underline">{c.fullName}</Link>
                        <div className="tabular text-xs text-muted">{c.code} · {formatPhoneDisplay(c.phone)} · {GENDER_LABELS[c.gender]} · {c.experienceYears} yrs</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="max-w-40 text-sm font-medium">{c.livingAreas.map((l) => l.livingArea.name).join(", ") || <span className="text-muted">-</span>}</Td>
                  <Td className="max-w-56 text-xs">{c.services.map((s) => s.serviceCategory.name).join(", ") || "-"}</Td>
                  <Td className="whitespace-nowrap">{c.supportedShifts.map((s) => SHIFT_LABELS[fromDbShift(s)]).join(", ")}</Td>
                  <Td className="max-w-56 text-xs">{workIn || "-"}</Td>
                  <Td><AvailabilityBadge status={c.availabilityStatus} /></Td>
                  <Td><VerificationBadge status={c.verificationStatus} /></Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} basePath={meta.listPath} params={sp} />
    </>
  );
}
