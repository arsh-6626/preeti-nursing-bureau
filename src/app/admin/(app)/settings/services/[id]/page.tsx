import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { Notice, Panel } from "@/components/ui/panel";
import { ServiceForm } from "@/components/admin/settings-forms";

export const metadata: Metadata = { title: "Service" };

export default async function ServiceEditPage({ params, searchParams }: PageProps<"/admin/settings/services/[id]">) {
  await requirePermissionPage("settings:write");
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const svc = isNew ? null : await db.serviceCategory.findUnique({ where: { id } });
  if (!isNew && !svc) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader title={svc ? svc.name : "Add service"} back={{ href: "/admin/settings#services", label: "Settings" }} />
      {sp.saved === "1" && <div className="mb-4"><Notice tone="success">Service saved.</Notice></div>}
      <Panel>
        <ServiceForm
          d={{
            id: svc?.id,
            name: svc?.name ?? "",
            slug: svc?.slug ?? "",
            summary: svc?.summary ?? "",
            description: svc?.description ?? "",
            imageUrl: svc?.imageUrl ?? "",
            requiredSkills: svc?.requiredSkills.join(", ") ?? "",
            indicativePrice: svc?.indicativePrice ?? "",
            notes: svc?.notes ?? "",
            isNursing: svc?.isNursing ?? false,
            isActive: svc?.isActive ?? true,
          }}
        />
      </Panel>
    </div>
  );
}
