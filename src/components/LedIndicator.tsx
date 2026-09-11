interface LedIndicatorProps {
  color?: 'accent' | 'green'
  label?: string
  pulse?: boolean
}

const COLOR_MAP = {
  accent: { dot: 'bg-accent', glow: 'shadow-glow' },
  green: { dot: 'bg-emerald-500', glow: 'shadow-glow-green' },
}

export default function LedIndicator({ color = 'green', label, pulse = true }: LedIndicatorProps) {
  const c = COLOR_MAP[color]
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${c.dot} ${c.glow} ${pulse ? 'animate-pulse' : ''}`} />
      {label && (
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          {label}
        </span>
      )}
    </div>
  )
}
