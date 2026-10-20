import "server-only";
import type { Actor } from "@/lib/auth/permissions";
import { listActiveServices, listAllAreas, listLivingAreas } from "@/lib/services/settings";
import { CAREGIVER_FORM_HIDDEN_SERVICES, DELHI, type StaffKind } from "@/lib/domain/staff";

type Linked = { serviceIds?: string[]; areaIds?: string[]; livingAreaIds?: string[] };

/** Options for the caregiver or nurse form. Inactive entries stay listed when the person is already linked to them. */
export async function staffFormOptions(actor: Actor, kind: StaffKind, linked: Linked = {}) {
  const [services, areas, living] = await Promise.all([listActiveServices(), listAllAreas(actor), listLivingAreas(actor, { includeInactive: true })]);
  const shownServices = services.filter((s) => kind === "NURSE" || !CAREGIVER_FORM_HIDDEN_SERVICES.includes(s.slug));
  return {
    services: shownServices.map((s) => ({ value: s.id, label: s.name })),
    delhiAreas: areas
      .filter((a) => a.city === DELHI && (a.isActive || linked.areaIds?.includes(a.id)))
      .map((a) => ({ value: a.id, label: a.locality })),
    livingAreas: living
      .filter((a) => a.isActive || linked.livingAreaIds?.includes(a.id))
      .map((a) => ({ value: a.id, label: a.isActive ? a.name : `${a.name} (inactive)` })),
  };
}
