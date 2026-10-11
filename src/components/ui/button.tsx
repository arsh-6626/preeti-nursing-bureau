import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet" | "mint" | "onInk" | "ink" | "field" | "marigold" | "onField" | "paper";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

const variants: Record<Variant, string> = {
  primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-[0_1px_0_rgb(15_34_55/0.08)]",
  secondary: "border border-line-strong bg-paper text-navy-900 hover:border-teal-600 hover:text-teal-700",
  ghost: "text-teal-700 hover:bg-teal-50",
  quiet: "text-muted hover:bg-mist hover:text-navy-900",
  danger: "border border-rose-700/30 bg-paper text-rose-700 hover:bg-rose-50",
  // Public site
  mint: "rounded-full bg-mint text-ink-950 hover:bg-mint-soft shadow-[0_8px_30px_-8px_rgb(124_242_210/0.55)]",
  onInk: "rounded-full border border-white/20 bg-white/5 text-white hover:border-mint/60 hover:bg-white/10",
  ink: "rounded-full bg-ink-950 text-white hover:bg-ink-800",
  field: "rounded-[12px] bg-field text-white hover:bg-field-deep",
  marigold: "rounded-[12px] bg-marigold text-text hover:bg-[#f6b955]",
  onField: "rounded-[12px] border border-white/35 text-white hover:border-white hover:bg-white/10",
  paper: "rounded-[12px] border border-rule bg-white text-text hover:border-text/40",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-13 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
