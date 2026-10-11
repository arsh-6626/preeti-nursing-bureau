import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { getPublicRequestStatus } from "@/lib/services/requests";
import { getPublicSettings } from "@/lib/services/settings";
import { LEAD_STATUS_PUBLIC } from "@/lib/domain/labels";
import { SHIFT_LABELS } from "@/lib/domain/shift";
import { formatDate, formatDateTime } from "@/lib/domain/dates";
import { ContactActions } from "@/components/public/contact-actions";
import { CopyButton } from "@/components/public/copy-button";

export const metadata: Metadata = { title: "Your request", robots: { index: false, follow: false } };

export default async function RequestStatusPage({ params, searchParams }: PageProps<"/request/status/[token]">) {
  const { token } = await params;
  const sp = await searchParams;
  const [status, settings] = await Promise.all([getPublicRequestStatus(token), getPublicSettings()]);
  if (!status) notFound();
  const isNew = sp.new === "1";
  return (
    <>
      <div className="relative overflow-hidden bg-field pb-32">
        <div className="relative mx-auto max-w-2xl px-4 pt-14 text-center sm:px-6">
          {isNew && (
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-marigold text-text">
              <CheckIcon size={28} weight="bold" aria-hidden />
            </span>
          )}
          <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.025em] text-white sm:text-5xl">
            {isNew ? "Request received" : "Your request"}
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-lg text-field-soft">{LEAD_STATUS_PUBLIC[status.status]}</p>
        </div>
      </div>
      <div className="relative mx-auto -mt-24 max-w-2xl px-4 pb-20 sm:px-6">
        <div className="rounded-[16px] bg-white p-7 shadow-[0_30px_70px_-45px_rgb(10_59_54/0.45)] ring-1 ring-rule sm:p-10">
          <p className="text-sm font-semibold text-text-2">Reference number</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-mono text-3xl font-semibold tracking-wider text-text sm:text-4xl">{status.reference}</p>
            <CopyButton value={status.reference} />
          </div>
          <p className="mt-2 text-text-2">Keep this number and quote it when you call or message us.</p>

          {isNew && (
            <p className="mt-8 rounded-2xl bg-paper-2 p-5 leading-relaxed text-text">
              We will call you to talk about the patient&apos;s needs and check which caregivers are available and suitable. This is not a
              confirmed booking: care is arranged only after you agree on the details with us.
            </p>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-field/[0.08]">
            {[
              ["Service", status.serviceName],
              ["Shift", SHIFT_LABELS[status.shiftType]],
              ["Start date", formatDate(status.startDate)],
              ["Area", status.area],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-4">
                <dt className="text-sm font-semibold text-text-2">{k}</dt>
                <dd className="mt-1 font-medium text-text">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-text-2">Submitted {formatDateTime(status.createdAt)}</p>

          <div className="mt-8 border-t border-rule pt-7">
            <p className="mb-3 font-semibold text-text">Want to talk sooner?</p>
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={`Hello, my request reference is ${status.reference}.`} showNumbers />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-text-2">
          Bookmark this page to check the status later. Anyone with this link can see the status, so share it only with family.
        </p>
      </div>
    </>
  );
}
