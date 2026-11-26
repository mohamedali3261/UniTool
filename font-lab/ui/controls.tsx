/** Small shared UI atoms for Font Lab — every panel composes these. */
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

export function PanelCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fl-card ${className}`.trim()}>
      <header className="fl-card-head">
        <div className="fl-card-title">
          {icon ? <span className="fl-card-icon">{icon}</span> : null}
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="fl-card-actions">{actions}</div> : null}
      </header>
      <div className="fl-card-body">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="fl-field">
      <span className="fl-field-label">
        {label}
        {hint ? <em>{hint}</em> : null}
      </span>
      {children}
    </label>
  );
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(String(Math.round(value)));
  }, [value]);
  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      setDraft(String(Math.round(value)));
      return;
    }
    const clamped = Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min ?? -Number.MAX_SAFE_INTEGER, parsed));
    onChange(clamped);
    setDraft(String(Math.round(clamped)));
  };
  return (
    <span className="fl-number">
      <input
        aria-label={ariaLabel}
        type="number"
        inputMode="decimal"
        value={draft}
        min={min}
        max={max}
        step={step}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          focused.current = false;
          commit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit((event.target as HTMLInputElement).value);
            (event.target as HTMLInputElement).blur();
          }
          if (event.key === 'Escape') {
            setDraft(String(Math.round(value)));
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
      {suffix ? <b>{suffix}</b> : null}
    </span>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  ariaLabel,
  onCommit,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  ariaLabel: string;
  onCommit?: (value: number) => void;
}) {
  return (
    <input
      className="fl-slider"
      aria-label={ariaLabel}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      onPointerUp={(event) => onCommit?.(Number((event.target as HTMLInputElement).value))}
      onKeyUp={(event) => onCommit?.(Number((event.target as HTMLInputElement).value))}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`fl-toggle${checked ? ' is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function ActionButton({
  children,
  onClick,
  icon,
  tone = 'quiet',
  disabled,
  title,
  active,
  full,
}: {
  children?: ReactNode;
  onClick: () => void;
  icon?: ReactNode;
  tone?: 'quiet' | 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  title?: string;
  active?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fl-btn fl-btn-${tone}${active ? ' is-active' : ''}${full ? ' is-full' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="fl-segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={option.value === value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span>{option.label}</span>
          {typeof option.count === 'number' ? <em>{option.count}</em> : null}
        </button>
      ))}
    </div>
  );
}

export function StatusDot({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  return <span className={`fl-dot fl-dot-${status}`} aria-hidden="true" />;
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="fl-empty">{children}</p>;
}
