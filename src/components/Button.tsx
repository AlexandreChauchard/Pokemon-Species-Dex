import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

const VARIANT_CLASSES = {
  primary:
    'bg-accent text-accent-foreground shadow-accent-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed',
  ghost:
    'bg-background text-ink-muted shadow-card hover:text-accent active:translate-y-[2px] active:shadow-pressed',
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 ease-mechanical disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
