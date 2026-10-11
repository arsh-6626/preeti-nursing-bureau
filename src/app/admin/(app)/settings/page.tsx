import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requirePermissionPage } from "@/lib/auth/dal";
import { getSettings, listAllAreas, listAllServices, listContentPages } from "@/lib/services/settings";
import { SHIFT_LABELS, SHIFT_TYPES, toDbShift } from "@/lib/domain/shift";
import { moneyString } from "@/lib/domain/money";
import { PageHeader } from "@/components/admin/page-header";
import { Notice, Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { InlineAction } from "@/components/admin/inline-action";
import { AreaForm, BusinessSettingsForm, CommissionPolicyForm, ContentPageForm, PricingForm } from "@/components/admin/settings-forms";
import { moveServiceAction, toggleAreaAction, toggleServiceAction } from "@/app/admin/actions/settings";

export const metadata: Metadata = { title: "Settings" };

const SECTIONS = [
  ["business", "Business"],
  ["commission", "Commission"],
  ["services", "Services"],
  ["pricing", "Pricing"],
  ["areas", "Service areas"],
  ["pages", "Policy pages"],
] as const;

export default async function SettingsPage() {
  const actor = await requirePermissionPage("settings:write");
  const [s, services, areas, pages] = await Promise.all([getSettings(), listAllServices(actor), listAllAreas(actor), listContentPages(actor)]);
  const missing = [!s.phone && "telephone", !s.whatsapp && "WhatsApp number", !s.businessHours && "business hours"].filter(Boolean);
  const cities = [...new Set(areas.map((a) => a.city))];
  return (
    <>
      <PageHeader title="Settings" description="Business details, website content, pricing and policies." />
      <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line px-3 py-1 text-sm font-medium text-ink hover:border-teal-600 hover:text-teal-700">{label}</a>
        ))}
      </nav>
      {missing.length > 0 && (
        <div className="mb-6"><Notice tone="warning">Add your {missing.join(", ")} so families can reach you. Call and WhatsApp buttons stay hidden until then.</Notice></div>
      )}
      <div className="grid gap-6">
        <Panel id="business" title="Business profile and website" className="scroll-mt-6">
          <BusinessSettingsForm
            d={{
              businessName: s.businessName,
              logoUrl: s.logoUrl ?? "",
              phone: s.phone ?? "",
              whatsapp: s.whatsapp ?? "",
              email: s.email ?? "",
              businessHours: s.businessHours ?? "",
              address: s.address ?? "",
              regionLabel: s.regionLabel,
              heroHeadline: s.heroHeadline,
              heroSubtext: s.heroSubtext,
              aboutText: s.aboutText,
              consentText: s.consentText,
              whatsappPrefill: s.whatsappPrefill,
              followUpDefaultHours: s.followUpDefaultHours,
              allowOtherService: s.allowOtherService,
            }}
          />
        </Panel>

        <Panel id="commission" title="Commission policy" className="scroll-mt-6">
          <CommissionPolicyForm
            d={{
              commissionMethod: s.commissionMethod,
              commissionRate: s.commissionRate.toString(),
              commissionFixedAmount: moneyString(s.commissionFixedAmount),
              commissionBasis: s.commissionBasis,
              commissionRecognition: s.commissionRecognition,
            }}
          />
        </Panel>

        <Panel id="services" title="Services" description="Shown on the website in this order." className="scroll-mt-6" actions={<LinkButton href="/admin/settings/services/new" size="sm" variant="secondary"><PlusIcon size={16} aria-hidden /> Add service</LinkButton>}>
          <ul className="divide-y divide-line">
            {services.map((svc, i) => (
              <li key={svc.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/settings/services/${svc.id}`} className="font-semibold text-teal-700 hover:underline">{svc.name}</Link>
                  <span className="ml-2 inline-flex gap-1 align-middle">
                    {!svc.isActive && <Badge tone="neutral">Inactive</Badge>}
                    {svc.isNursing && <Badge tone="teal">Nursing</Badge>}
                  </span>
                  <p className="text-xs text-muted">/services/{svc.slug} · {svc._count.requests} requests · {svc._count.caregivers} caregivers</p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {i > 0 && <InlineAction action={moveServiceAction} fields={{ id: svc.id, direction: "up" }} label={<><ArrowUpIcon size={14} aria-hidden /><span className="sr-only">Move up</span></>} variant="quiet" />}
                  {i < services.length - 1 && <InlineAction action={moveServiceAction} fields={{ id: svc.id, direction: "down" }} label={<><ArrowDownIcon size={14} aria-hidden /><span className="sr-only">Move down</span></>} variant="quiet" />}
                  <InlineAction action={toggleServiceAction} fields={{ id: svc.id, active: svc.isActive ? "0" : "1" }} label={svc.isActive ? "Deactivate" : "Activate"} variant="quiet" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel id="pricing" title="Pricing and payouts by shift type" description="Indicative rates used to suggest amounts when proposing a caregiver. 12-hour and 24-hour prices are set separately." className="scroll-mt-6">
          <p className="mb-4 text-sm text-muted">Shift types are fixed to {SHIFT_TYPES.map((t) => SHIFT_LABELS[t]).join(" and ")}. No other durations can be added.</p>
          <div className="grid gap-6">
            {services.filter((svc) => svc.isActive).map((svc) => (
              <div key={svc.id}>
                <h3 className="mb-2 text-sm font-semibold text-navy-900">{svc.name}</h3>
                <div className="grid gap-3">
                  {SHIFT_TYPES.map((shift) => {
                    const rule = svc.pricingRules.find((r) => r.shiftType === toDbShift(shift));
                    return (
                      <PricingForm
                        key={shift}
                        serviceCategoryId={svc.id}
                        shiftType={shift}
                        label={SHIFT_LABELS[shift]}
                        d={{ ratePeriod: rule?.ratePeriod ?? "PER_DAY", customerRate: rule ? moneyString(rule.customerRate) : "", caregiverPayout: rule ? moneyString(rule.caregiverPayout) : "" }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="areas" title="Service areas" description="Only active areas appear on the request form. Listing an area does not promise availability." className="scroll-mt-6">
          <AreaForm />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <div key={city}>
                <h3 className="text-sm font-semibold text-navy-900">{city}</h3>
                <ul className="mt-2 grid gap-1">
                  {areas.filter((a) => a.city === city).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className={a.isActive ? "text-ink" : "text-muted line-through"}>{a.locality}{a.pincode ? ` · ${a.pincode}` : ""}</span>
                      <InlineAction action={toggleAreaAction} fields={{ id: a.id, active: a.isActive ? "0" : "1" }} label={a.isActive ? "Deactivate" : "Activate"} variant="quiet" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="pages" title="Policy pages" description="Draft wording is provided. Review it, ideally with legal advice, before relying on it." className="scroll-mt-6">
          <div className="grid gap-4">
            {pages.map((p) => (
              <details key={p.id} className="rounded-[var(--radius-control)] border border-line p-4">
                <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between gap-2 font-semibold text-navy-900">
                  {p.title}
                  {p.needsReview ? <Badge tone="amber">Needs review</Badge> : <Badge tone="green">Reviewed</Badge>}
                </summary>
                <div className="mt-4"><ContentPageForm d={{ slug: p.slug, title: p.title, body: p.body, needsReview: p.needsReview }} /></div>
              </details>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
