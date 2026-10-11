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
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper-2/95 px-4 py-3 backdrop-blur sm:hidden">
      <div className="flex gap-2">
        {tel && (
          <a href={tel} className={buttonClass("paper", "lg", "w-14 px-0")} aria-label="Call us">
            <PhoneIcon size={20} aria-hidden />
          </a>
        )}
        <Link href="/request" className={buttonClass("field", "lg", "flex-1")}>
          Find a Caregiver
        </Link>
      </div>
    </div>
  );
}
