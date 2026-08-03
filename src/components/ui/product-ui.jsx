import { useId, useRef } from "react";
import { motion as Motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function ProductMark({ className }) {
  return (
    <img
      src="/270970406.jpeg"
      alt=""
      className={cn(
        "inline-block h-9 w-9 shrink-0 rounded-xl border border-border/50 bg-white object-contain p-0.5 shadow-sm",
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function PageFrame({ className, children }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8", className)}>
      {children}
    </div>
  );
}

export function PageLead({ eyebrow, title, description, icon: Icon, actions, className }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-primary">
            {Icon ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-3.5 w-3.5" />
              </span>
            ) : null}
            {eyebrow}
          </div>
        ) : null}
        <h1 className="page-heading text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusPill({ tone = "neutral", children, className }) {
  const tones = {
    neutral: "border-border/70 bg-muted/60 text-muted-foreground",
    primary: "border-primary/15 bg-primary/8 text-primary",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tones[tone] || tones.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SegmentedControl({
  value,
  onValueChange,
  items,
  ariaLabel = "View options",
  className,
  compactOnMobile = false,
}) {
  const instanceId = useId().replace(/:/g, "");
  const refs = useRef([]);

  const handleKeyDown = (event, index) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    refs.current[nextIndex]?.focus();
    onValueChange(items[nextIndex].value);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border/65 bg-muted/60 p-1 shadow-sm",
        className,
      )}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={compactOnMobile ? item.label : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected ? (
              <Motion.span
                layoutId={`segmented-control-${instanceId}`}
                className="absolute inset-0 rounded-lg border border-border/60 bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                aria-hidden="true"
              />
            ) : null}
            {Icon ? <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" /> : null}
            <span className={cn("relative z-10", compactOnMobile && "hidden sm:inline")}>
              {item.label}
            </span>
            {compactOnMobile && item.shortLabel ? (
              <span className="relative z-10 sm:hidden">{item.shortLabel}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-5 py-16 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary shadow-sm">
        {Icon ? <Icon className="h-6 w-6" /> : <ProductMark className="h-10 w-10" />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, detail, tone = "primary", className }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  };

  return (
    <div className={cn("app-card interactive-card rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="meta-label">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone] || tones.primary)}>
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </div>
      </div>
    </div>
  );
}
