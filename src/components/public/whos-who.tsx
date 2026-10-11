import { CheckIcon, MinusIcon } from "@phosphor-icons/react/ssr";

const ROWS: { task: string; gda: boolean; nurse: boolean }[] = [
  { task: "Bathing, grooming and dressing", gda: true, nurse: true },
  { task: "Feeding and fluids", gda: true, nurse: true },
  { task: "Help walking, getting up, changing position", gda: true, nurse: true },
  { task: "Toileting and diaper care", gda: true, nurse: true },
  { task: "Reminders to take medicines", gda: true, nurse: true },
  { task: "Company through the day or night", gda: true, nurse: true },
  { task: "Injections and IV care, as prescribed", gda: false, nurse: true },
  { task: "Wound dressing", gda: false, nurse: true },
  { task: "Catheter or feeding-tube care", gda: false, nurse: true },
];

/** Plain comparison of what a GDA or attendant does versus a home nurse. */
export function WhosWho() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-rule bg-white">
      <div className="grid grid-cols-[1fr_88px_88px] items-end border-b border-rule bg-paper-2 px-4 py-4 sm:grid-cols-[1fr_180px_180px] sm:px-8">
        <span className="text-sm font-medium text-text-2">Task</span>
        <span className="text-center font-display text-sm font-bold leading-tight text-text sm:text-lg">GDA or attendant</span>
        <span className="text-center font-display text-sm font-bold leading-tight text-text sm:text-lg">Home nurse</span>
      </div>
      <ul>
        {ROWS.map((r, i) => (
          <li
            key={r.task}
            className={`grid grid-cols-[1fr_88px_88px] items-center px-4 py-3.5 text-[15px] sm:grid-cols-[1fr_180px_180px] sm:px-8 sm:text-base ${i % 2 === 1 ? "bg-paper-2/60" : ""} ${!r.gda ? "font-medium" : ""}`}
          >
            <span className="pr-3 text-text">{r.task}</span>
            {[r.gda, r.nurse].map((ok, j) => (
              <span key={j} className="flex justify-center">
                {ok ? (
                  <span className="grid size-7 place-items-center rounded-full bg-field text-white">
                    <CheckIcon size={15} weight="bold" aria-label="Yes" />
                  </span>
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-rule text-text-2">
                    <MinusIcon size={15} weight="bold" aria-label="No" />
                  </span>
                )}
              </span>
            ))}
          </li>
        ))}
      </ul>
      <p className="border-t border-rule px-4 py-4 text-sm text-text-2 sm:px-8">
        Clinical tasks follow your doctor&apos;s instructions. Neither caregivers nor nurses prescribe or change medication.
      </p>
    </div>
  );
}
