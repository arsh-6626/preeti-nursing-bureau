"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneIcon } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui/button";

/**
 * Phones only: keeps the primary action (and a call button when a number is
 * configured) within reach on every public page except the request form itself.
 */
export function MobileActionBar({ tel }: { tel: string | null }) {
  const pathname = usePathname();
  if (pathname.startsWith("/request")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-paper/85 sm:hidden">
      <div className="flex gap-2">
        {tel && (
          <a href={tel} className={buttonClass("secondary", "lg", "px-4")} aria-label="Call us">
            <PhoneIcon size={20} aria-hidden />
          </a>
        )}
        <Link href="/request" className={buttonClass("primary", "lg", "flex-1")}>
          Find a Caregiver
        </Link>
      </div>
    </div>
  );
}
