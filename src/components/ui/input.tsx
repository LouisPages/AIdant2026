import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-control border border-line bg-surface px-4 text-body text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-teal focus:shadow-[0_0_0_3px_var(--color-teal-soft),inset_0_0_0_0.5px_var(--color-teal)]";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, "h-12", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-28 resize-none py-3", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(base, "h-12 cursor-pointer appearance-none pr-11", className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        size={20}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute"
      />
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-label font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-2 block text-label text-ink-2">{hint}</span>}
    </label>
  );
}
