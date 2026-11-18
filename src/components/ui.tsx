import type { ReactNode, InputHTMLAttributes } from 'react';

type IconName = 'home' | 'calc' | 'scale' | 'users' | 'sliders' | 'shield' | 'doc' | 'arrow' | 'check' | 'alert' | 'x' | 'download' | 'plus' | 'search' | 'spark' | 'clock' | 'building';

const paths: Record<IconName, ReactNode> = {
  home: <><path d="M3 11l9-8 9 8M5 10v11h14V10M10 21v-7h4v7" /></>,
  calc: <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" /></>,
  scale: <><path d="M12 3v18M7 21h10M4 7h16" /><path d="M4 7l-2.5 6a3 3 0 0 0 5 0L4 7zM20 7l-2.5 6a3 3 0 0 0 5 0L20 7z" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  shield: <><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  arrow: <path d="M19 12H5M11 6l-6 6 6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: <><path d="M12 4l9 16H3l9-16z" /><path d="M12 10v4M12 17h.01" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  building: <><path d="M4 21V6l8-3 8 3v15" /><path d="M9 21v-4h6v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01" /></>,
};

export function Icon({ name, className = 'w-5 h-5' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="w-9 h-9 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={light ? '#f3ece0' : '#0d3b3a'} />
        <path d="M7 23 L13 11 L19 19 L25 9" fill="none" stroke="#d9b26b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-display text-2xl leading-none ${light ? 'text-sand-50' : 'text-ink-900'}`}>مسار</span>
    </span>
  );
}

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-sand-200 bg-white text-sm text-ink-900 transition focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-400/15';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700 block mb-1.5">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-500 mt-1 block">{hint}</span>}
    </label>
  );
}

type NumProps = { label: string; value: number; onChange: (v: number) => void; suffix?: string; error?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export function NumberField({ label, value, onChange, suffix, error, ...rest }: NumProps) {
  return (
    <Field label={label}>
      <span className="relative block">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={`${inputCls} num text-right ${suffix ? 'pl-12' : ''} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-400/15' : ''}`}
          aria-invalid={!!error}
          {...rest}
        />
        {suffix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-400 pointer-events-none">{suffix}</span>}
      </span>
      {error && <span className="text-[11px] text-red-600 mt-1 block">{error}</span>}
    </Field>
  );
}

export function TextField({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <Field label={label}>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} {...rest} />
    </Field>
  );
}

export function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer select-none">
      <span>
        <span className="text-[13px] font-semibold text-ink-800 block">{label}</span>
        {hint && <span className="text-[11px] text-ink-500 leading-relaxed block mt-0.5">{hint}</span>}
      </span>
      <span className="relative shrink-0 mt-0.5">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block w-10 h-6 rounded-full bg-sand-200 transition peer-checked:bg-ink-700 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500" />
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white shadow transition peer-checked:-translate-x-4" />
      </span>
    </label>
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-white rounded-2xl border border-sand-200 shadow-[0_1px_0_rgba(13,59,58,.04),0_10px_30px_-18px_rgba(13,59,58,.25)] ${className}`}>{children}</div>;
}

export function BankMark({ color, short, size = 'w-10 h-10 text-base' }: { color: string; short: string; size?: string }) {
  return (
    <span className={`${size} rounded-xl grid place-items-center font-display text-white shrink-0`} style={{ background: color }} aria-hidden="true">
      {short}
    </span>
  );
}
