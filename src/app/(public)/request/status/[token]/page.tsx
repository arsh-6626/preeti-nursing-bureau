import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
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
    <div className="bg-mist">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[var(--radius-panel)] border border-line bg-paper p-6 shadow-[var(--shadow-raise)] sm:p-8">
          {isNew && (
            <div className="flex items-center gap-3 text-leaf-700">
              <CheckCircleIcon size={32} weight="fill" aria-hidden />
              <p className="text-lg font-semibold">Your request has been received</p>
            </div>
          )}
          <h1 className={`${isNew ? "mt-5" : ""} text-sm font-semibold text-muted`}>Your reference number</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="tabular text-3xl font-bold tracking-wider text-navy-900 sm:text-4xl">{status.reference}</p>
            <CopyButton value={status.reference} />
          </div>
          <p className="mt-2 text-sm text-muted">Please keep this number. Quote it when you call or message us.</p>

          <div className="mt-6 rounded-[var(--radius-control)] bg-teal-50 px-4 py-3 text-teal-800">
            <p className="text-sm font-semibold">Current status</p>
            <p className="mt-0.5">{LEAD_STATUS_PUBLIC[status.status]}</p>
          </div>

          {isNew && (
            <p className="mt-6 leading-relaxed text-ink">
              We will call you to talk about the patient&apos;s needs and check which caregivers are available and
              suitable. Your request is not a confirmed booking: care is arranged only after you agree on the details
              with us.
            </p>
          )}

          <dl className="mt-6 grid grid-cols-[130px_1fr] gap-y-2 border-t border-line pt-5 text-[15px]">
            <dt className="text-muted">Service</dt>
            <dd className="text-ink">{status.serviceName}</dd>
            <dt className="text-muted">Shift</dt>
            <dd className="text-ink">{SHIFT_LABELS[status.shiftType]}</dd>
            <dt className="text-muted">Start date</dt>
            <dd className="text-ink">{formatDate(status.startDate)}</dd>
            <dt className="text-muted">Area</dt>
            <dd className="text-ink">{status.area}</dd>
            <dt className="text-muted">Submitted</dt>
            <dd className="text-ink">{formatDateTime(status.createdAt)}</dd>
          </dl>

          <div className="mt-8 border-t border-line pt-6">
            <p className="mb-3 text-sm font-semibold text-navy-900">Want to talk sooner?</p>
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} prefill={`Hello, my request reference is ${status.reference}.`} showNumbers />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Bookmark this page to check the status later. Anyone with this link can see the status, so share it only with family.
        </p>
      </div>
    </div>
  );
}
