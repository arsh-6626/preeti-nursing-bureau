"use client";

import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { saveCustomerAction } from "@/app/admin/actions/customers";
import { CONTACT_METHOD_LABELS } from "@/lib/domain/labels";

export function CustomerForm({ defaults }: { defaults: { id?: string; name?: string; phone?: string; email?: string | null; relationship?: string | null; preferredContact?: string } }) {
  return (
    <ActionForm action={saveCustomerAction} className="grid gap-4 sm:grid-cols-2">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <TextField name="name" label="Name" required defaultValue={defaults.name} />
      <TextField name="phone" label="Mobile number" type="tel" required defaultValue={defaults.phone} />
      <TextField name="email" label="Email" type="email" defaultValue={defaults.email ?? ""} />
      <TextField name="relationship" label="Relationship to patient" defaultValue={defaults.relationship ?? ""} />
      <SelectField name="preferredContact" label="Preferred contact" required defaultValue={defaults.preferredContact ?? "PHONE"} options={Object.entries(CONTACT_METHOD_LABELS).map(([value, label]) => ({ value, label }))} />
      <div className="sm:col-span-2"><SubmitButton>{defaults.id ? "Save" : "Create customer"}</SubmitButton></div>
    </ActionForm>
  );
}
