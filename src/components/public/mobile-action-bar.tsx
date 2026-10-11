"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneIcon } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui/button";

/** Phones only: keeps the primary action within reach on every public page except the request form. */
export function MobileActionBar({ tel }: { tel: string | null }) {
  const pathname = usePathname();
  if (pathname.startsWith("/request")) return null;
  return (
    <div className="on-ink fixed inset-x-3 bottom-3 z-20 sm:hidden">
      <div className="flex gap-2 rounded-full border border-white/10 bg-ink-950/90 p-1.5 shadow-[0_12px_40px_-10px_rgb(6_26_29/0.7)] backdrop-blur-xl">
        {tel && (
          <a href={tel} className={buttonClass("onInk", "md", "w-12 px-0")} aria-label="Call us">
            <PhoneIcon size={20} aria-hidden />
          </a>
        )}
        <Link href="/request" className={buttonClass("mint", "md", "flex-1")}>
          Find a Caregiver
        </Link>
      </div>
    </div>
  );
}
