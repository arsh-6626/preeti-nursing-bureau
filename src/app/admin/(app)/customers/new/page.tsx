import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/ui/panel";
import { CustomerForm } from "@/components/admin/customer-form";

export const metadata: Metadata = { title: "Add customer" };

export default async function NewCustomerPage() {
  await requirePermissionPage("customer:write");
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add customer" back={{ href: "/admin/customers", label: "Customers" }} description="To record a care request too, create a lead instead." />
      <Panel><CustomerForm defaults={{}} /></Panel>
    </div>
  );
}
