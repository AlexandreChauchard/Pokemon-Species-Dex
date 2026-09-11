import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted"
      >
        {label}
      </label>
      <input
        id={id}
        className="h-14 w-full rounded-md border-none bg-background px-5 font-mono text-base text-ink shadow-recessed outline-none placeholder:text-ink-muted/50 focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_#ff4757] disabled:cursor-not-allowed disabled:opacity-50"
        {...inputProps}
      />
    </div>
  )
}
