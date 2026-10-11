import type { ComponentProps, ReactNode } from "react";

export function TableWrap({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-line bg-paper">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function Th({ className = "", ...props }: ComponentProps<"th">) {
  return <th scope="col" className={`bg-mist px-4 py-2.5 text-left text-xs font-semibold text-muted ${className}`} {...props} />;
}

export function Td({ className = "", ...props }: ComponentProps<"td">) {
  return <td className={`border-t border-line px-4 py-3 align-top ${className}`} {...props} />;
}
