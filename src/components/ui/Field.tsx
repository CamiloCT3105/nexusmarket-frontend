import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted/70 " +
  "transition-colors focus:border-brand focus:outline-none focus:ring-4 focus:ring-ring/40 " +
  "disabled:opacity-60 aria-[invalid=true]:border-danger";

type FieldWrapperProps = {
  label?: string;
  hint?: string;
  error?: string | undefined;
  id: string;
  children: ReactNode;
};

function FieldWrapper({ label, hint, error, id, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string | undefined;
  leading?: ReactNode;
};

export function Input({ label, hint, error, leading, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper label={label ?? ""} hint={hint ?? ""} error={error} id={inputId}>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{leading}</span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${inputId}-msg` : undefined}
          className={cn(control, leading ? "pl-9" : undefined, className)}
          {...rest}
        />
      </div>
    </FieldWrapper>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, options, className, id, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <FieldWrapper label={label ?? ""} id={selectId}>
      <select id={selectId} className={cn(control, "cursor-pointer pr-8", className)} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
