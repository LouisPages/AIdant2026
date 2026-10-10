import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

type Props = {
  variant?: Variant;
  href?: string;
  full?: boolean;
  icon?: ReactNode;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const variants: Record<Variant, string> = {
  primary:
    "bg-teal text-white font-semibold hover:bg-teal-dark active:bg-teal-dark disabled:bg-line disabled:text-mute",
  secondary:
    "border border-teal bg-transparent text-teal-dark font-semibold active:bg-teal-soft hover:bg-teal-soft/60 disabled:border-line disabled:text-mute",
  tertiary: "bg-transparent text-teal-dark font-semibold hover:bg-teal-soft/60 active:bg-teal-soft",
  danger:
    "border border-danger bg-transparent text-danger font-semibold active:bg-danger-soft hover:bg-danger-soft/60",
};

export function Button({ variant = "primary", href, full = true, icon, className, children, ...rest }: Props) {
  const classes = cn(
    "pressable inline-flex h-12 items-center justify-center gap-2 rounded-control px-5 text-[16px] leading-none outline-none focus-visible:shadow-[0_0_0_3px_var(--color-teal-soft)] disabled:cursor-not-allowed",
    full && "w-full",
    variants[variant],
    className,
  );
  if (href && rest.disabled) {
    return (
      <button type="button" disabled className={classes}>
        {icon}
        {children}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className={classes} onClick={rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
