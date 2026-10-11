import { SHIFT_LABELS, SHIFT_TYPES, type ShiftType } from "@/lib/domain/shift";

const SHORT: Record<ShiftType, string> = {
  "12_HOURS": "Day or night duty",
  "24_HOURS": "Round-the-clock, with planned rest",
};

/**
 * The two permitted shift types as identical, side-by-side choice faces.
 * Pure HTML radios, so it works without JavaScript.
 */
export function ShiftChoice({ name = "shift", defaultValue, required = false }: { name?: string; defaultValue?: ShiftType; required?: boolean }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-navy-900">Shift length</legend>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {SHIFT_TYPES.map((s) => (
          <label
            key={s}
            className="group relative flex cursor-pointer flex-col rounded-[var(--radius-control)] border border-line-strong bg-paper px-4 py-3 transition-colors hover:border-teal-600 has-checked:border-teal-600 has-checked:bg-teal-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-600"
          >
            <input type="radio" name={name} value={s} defaultChecked={defaultValue === s} required={required} className="sr-only" />
            <span className="tabular text-2xl font-bold tracking-tight text-navy-900">{SHIFT_LABELS[s].split(" ")[0]}<span className="ml-1 text-sm font-semibold text-muted">hours</span></span>
            <span className="mt-0.5 text-sm leading-snug text-muted">{SHORT[s]}</span>
            <span aria-hidden className="absolute right-3 top-3 size-4 rounded-full border border-line-strong bg-paper group-has-checked:border-[5px] group-has-checked:border-teal-600" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
