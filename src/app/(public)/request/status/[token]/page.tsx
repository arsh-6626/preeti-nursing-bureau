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
      <div className="on-ink relative -mt-[68px] overflow-hidden bg-ink-950 pb-32 pt-[68px]">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 size-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,rgb(124_242_210/0.2),transparent)]" />
        <div className="relative mx-auto max-w-2xl px-4 pt-14 text-center sm:px-6">
          {isNew && (
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-mint text-ink-950">
              <CheckIcon size={28} weight="bold" aria-hidden />
            </span>
          )}
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            {isNew ? "Request received" : "Your request"}
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-lg text-on-ink-muted">{LEAD_STATUS_PUBLIC[status.status]}</p>
        </div>
      </div>
      <div className="relative mx-auto -mt-24 max-w-2xl px-4 pb-20 sm:px-6">
        <div className="rounded-[28px] bg-white p-7 shadow-[0_40px_90px_-50px_rgb(6_26_29/0.5)] ring-1 ring-ink-950/[0.06] sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-700">Reference number</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-mono text-3xl font-semibold tracking-wider text-ink-950 sm:text-4xl">{status.reference}</p>
            <CopyButton value={status.reference} />
          </div>
          <p className="mt-2 text-ink-700">Keep this number and quote it when you call or message us.</p>

          {isNew && (
            <p className="mt-8 rounded-2xl bg-fog p-5 leading-relaxed text-ink-950">
              We will call you to talk about the patient&apos;s needs and check which caregivers are available and suitable. This is not a
              confirmed booking: care is arranged only after you agree on the details with us.
            </p>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink-950/[0.08]">
            {[
              ["Service", status.serviceName],
              ["Shift", SHIFT_LABELS[status.shiftType]],
              ["Start date", formatDate(status.startDate)],
              ["Area", status.area],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-4">
                <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-700">{k}</dt>
                <dd className="mt-1 font-medium text-ink-950">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-ink-700">Submitted {formatDateTime(status.createdAt)}</p>

          <div className="mt-8 border-t border-ink-950/[0.08] pt-7">
            <p className="mb-3 font-semibold text-ink-950">Want to talk sooner?</p>
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={`Hello, my request reference is ${status.reference}.`} showNumbers />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-700">
          Bookmark this page to check the status later. Anyone with this link can see the status, so share it only with family.
        </p>
      </div>
    </>
  );
}
