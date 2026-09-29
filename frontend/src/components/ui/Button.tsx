import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline" | "soft";
type Size = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-2 shrink-0 rounded-[var(--radius-control)] font-semibold text-small " +
  "transition-colors duration-150 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent-solid text-white hover:bg-accent-solid-hover active:bg-accent-press",
  secondary: "bg-panel text-ink border border-line-strong hover:bg-sunken active:bg-wash",
  ghost: "text-body hover:text-ink hover:bg-wash active:bg-line",
  danger: "bg-danger-solid text-white hover:bg-danger-solid-hover",
  "danger-outline": "bg-panel text-danger border border-danger-line hover:bg-danger-bg",
  soft: "bg-accent-bg text-accent-ink hover:bg-accent-line/50"
};

// Spec: 44px primary controls; `sm` is for dense table rows (36px).
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4"
};

function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon: Icon, loading = false, disabled, className, children, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
      )}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

export function ButtonLink({ variant = "secondary", size = "md", icon: Icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, typeof className === "string" ? className : undefined)} {...rest}>
      {Icon && <Icon className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}
      {children}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons are named for screen readers and shown as a tooltip. */
  label: string;
  icon: LucideIcon;
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon: Icon, size = "md", className, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center shrink-0 rounded-[var(--radius-control)] text-body cursor-pointer",
        "hover:text-ink hover:bg-wash active:bg-line transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "w-9 h-9" : "w-11 h-11",
        className
      )}
      {...rest}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
});
