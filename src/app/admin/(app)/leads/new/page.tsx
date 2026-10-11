import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { listActiveAreas, listActiveServices } from "@/lib/services/settings";
import { PageHeader } from "@/components/admin/page-header";
import { ManualLeadForm } from "@/components/admin/manual-lead-form";

export const metadata: Metadata = { title: "New lead" };

export default async function NewLeadPage({ searchParams }: PageProps<"/admin/leads/new">) {
  await requirePermissionPage("lead:create");
  const sp = await searchParams;
  const inquiryId = typeof sp.inquiry === "string" && /^[0-9a-f-]{36}$/i.test(sp.inquiry) ? sp.inquiry : undefined;
  const [services, areas, inquiry] = await Promise.all([
    listActiveServices(),
    listActiveAreas(),
    inquiryId ? db.contactInquiry.findUnique({ where: { id: inquiryId } }) : null,
  ]);
  return (
    <div className="max-w-3xl">
      <PageHeader title="New lead" description="For inquiries received by phone, WhatsApp or referral." back={{ href: "/admin/leads", label: "Leads" }} />
      <ManualLeadForm
        services={services.map((s) => ({ value: s.id, label: s.name }))}
        areas={areas}
        defaults={inquiry ? { customerName: inquiry.name, phone: inquiry.phone, inquiryId: inquiry.id, preferredContact: inquiry.preferredContact } : {}}
      />
    </div>
  );
}
