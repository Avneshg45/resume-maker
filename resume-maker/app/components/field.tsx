"use client";
import { useId, type ReactNode } from "react";

export const inputCls = (err?: string) =>
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] placeholder-[#94A3B8] outline-none focus:ring-2 " +
  (err ? "border-[#B42318] focus:ring-[#B42318]/20" : "border-[#D5DCE6] focus:border-[#2459E0] focus:ring-[#2459E0]/20");

type FieldProps = {
  label: string; value: string; onChange: (v: string) => void; ph?: string; rows?: number;
  error?: string; onBlur?: () => void; max?: number; required?: boolean;
};

export function Field({ label, value, onChange, ph, rows = 1, error, onBlur, max, required }: FieldProps) {
  const id = useId();
  const common = {
    id, value, placeholder: ph, maxLength: max, onBlur,
    "aria-invalid": !!error,
    "aria-describedby": error ? id + "-err" : undefined,
    className: inputCls(error),
  };
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
        {label}
        {required && <span className="text-[#B42318]"> *</span>}
      </label>
      {rows === 1 ? (
        <input {...common} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <textarea {...common} rows={rows} onChange={(e) => onChange(e.target.value)} />
      )}
      <div className="mt-1 flex justify-between gap-2">
        <p id={id + "-err"} role={error ? "alert" : undefined} className="text-xs text-[#B42318]">{error}</p>
        {max && rows > 1 && <span className="text-xs text-[#94A3B8]">{value.length}/{max}</span>}
      </div>
    </div>
  );
}

export function Group({ title, onRemove, children }: { title: string; onRemove?: () => void; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#0F172A]">{title}</span>
        {onRemove && (
          <button onClick={onRemove} className="text-[13px] font-semibold text-[#B42318] hover:underline">
            Remove
          </button>
        )}
      </div>
      {children}
    </div>
  );
}