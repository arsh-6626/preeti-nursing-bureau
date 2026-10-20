"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";

const MAX_EDGE = 1600;

/** Downscales a phone photo to a JPEG of at most 1600px on its long edge, so uploads stay small. */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/**
 * Image field for staff photos and ID. Shows the current image, previews the
 * new one, and swaps the chosen file for a smaller JPEG before the form submits.
 */
export function ImageUpload({ name, label, hint, currentSrc }: { name: string; label: string; hint?: string; currentSrc?: string | null }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo (JPG, PNG or WebP).");
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const small = await shrink(file);
      const dt = new DataTransfer();
      dt.items.add(small);
      if (input.current) input.current.files = dt.files;
      setPreview(URL.createObjectURL(small));
    } catch {
      // Formats the browser cannot decode (e.g. some HEIC files) are sent as chosen; the server checks them.
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  const shown = preview ?? currentSrc;
  return (
    <div className="flex items-start gap-4">
      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-control)] border border-line bg-paper text-xs text-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated admin route and local previews; next/image cannot fetch either */}
        {shown ? <img src={shown} alt="" className="size-full object-cover" /> : "No image"}
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-semibold text-navy-900">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        <input
          ref={input}
          id={id}
          name={name}
          type="file"
          accept="image/*"
          onChange={onChange}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-[var(--radius-control)] file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-sm file:font-medium hover:file:border-teal-600"
        />
        {busy && <p className="mt-1 text-xs text-muted">Preparing image…</p>}
        {error && <p className="mt-1 text-xs font-medium text-rose-700">{error}</p>}
        {currentSrc && !preview && <p className="mt-1 text-xs text-muted">Leave empty to keep the current image.</p>}
      </div>
    </div>
  );
}
