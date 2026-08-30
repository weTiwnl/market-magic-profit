import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { parseNumberInput } from "@/utils/format";

export function Panel({
  title,
  step,
  action,
  children,
  className,
}: {
  title: string;
  step?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel-surface p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="eyebrow">{title}</h2>
        {action ?? (step ? <span className="num text-[11px] text-dim">{step}</span> : null)}
      </div>
      {children}
    </section>
  );
}

export function FieldLabel({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <span className="mb-1.5 flex items-center justify-between gap-2 text-[12px] text-mut">
      <span>{children}</span>
      {extra}
    </span>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg bg-field px-3 text-[14px] text-foreground ring-1 ring-hairline placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
    </label>
  );
}

interface NumberFieldProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  emphasis?: boolean;
  extra?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Numeric input that keeps what the user typed while emitting a parsed float. */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  emphasis,
  extra,
  disabled,
  className,
}: NumberFieldProps) {
  const [text, setText] = useState(() => (value === 0 ? "" : String(value).replace(".", ",")));
  const focused = useRef(false);

  useEffect(() => {
    if (focused.current) return;
    setText(value === 0 ? "" : String(value).replace(".", ","));
  }, [value]);

  const field = (
    <div
      className={cn(
        "flex h-11 items-center rounded-lg ring-1 transition-colors",
        emphasis
          ? "bg-profit/10 ring-profit/40 focus-within:ring-2 focus-within:ring-profit"
          : "bg-field ring-hairline focus-within:ring-2 focus-within:ring-ring/50",
        disabled && "opacity-40",
      )}
    >
      {prefix ? (
        <span className={cn("num pl-3 text-[13px]", emphasis ? "text-profit/80" : "text-dim")}>
          {prefix}
        </span>
      ) : null}
      <input
        inputMode="decimal"
        disabled={disabled}
        value={text}
        placeholder="0,00"
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(value === 0 ? "" : String(value).replace(".", ","));
        }}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseNumberInput(e.target.value));
        }}
        className={cn(
          "num h-full w-full bg-transparent px-2 text-[14px] placeholder:text-dim focus:outline-none",
          emphasis && "text-[15px] font-semibold text-profit",
        )}
      />
      {suffix ? <span className="num pr-3 text-[13px] text-dim">{suffix}</span> : null}
    </div>
  );

  if (!label) return <div className={className}>{field}</div>;

  return (
    <label className={cn("block", className)}>
      <FieldLabel extra={extra}>{label}</FieldLabel>
      {field}
    </label>
  );
}

export function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex h-11 items-center rounded-lg bg-field ring-1 ring-hairline">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="num grid size-11 place-items-center text-[16px] text-mut hover:text-foreground"
        >
          −
        </button>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(Math.max(1, Math.round(parseNumberInput(e.target.value)) || 1))}
          className="num h-full w-full bg-transparent text-center text-[14px] focus:outline-none"
        />
        <button
          type="button"
          aria-label="Aumentar quantidade"
          onClick={() => onChange(value + 1)}
          className="num grid size-11 place-items-center text-[16px] text-mut hover:text-foreground"
        >
          +
        </button>
      </div>
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-2.5 text-[13px] ring-1 transition-colors",
              active
                ? "bg-profit/10 font-semibold text-profit ring-profit/40"
                : "bg-field font-medium text-mut ring-hairline hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-4 w-7 shrink-0 rounded-full ring-1 transition-colors",
        checked ? "bg-profit/30 ring-profit/50" : "bg-field ring-hairline",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-3 rounded-full transition-all",
          checked ? "left-3.5 bg-profit" : "left-0.5 bg-dim",
        )}
      />
    </button>
  );
}
