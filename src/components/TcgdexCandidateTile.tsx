import { Check } from 'lucide-react'
import type { TcgdexCandidate } from '../lib/tcgdex'

interface TcgdexCandidateTileProps {
  candidate: TcgdexCandidate
  selected: boolean
  onToggle: (key: string) => void
}

// Lightest formats first for a fast-loading review grid; not every card has
// every combo, so fall back through the rest before giving up.
const PREVIEW_FALLBACK_SUFFIXES = ['low.webp', 'low.png', 'high.webp', 'high.png']

export default function TcgdexCandidateTile({
  candidate,
  selected,
  onToggle,
}: TcgdexCandidateTileProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(candidate.key)}
      aria-pressed={selected}
      className={`group relative flex flex-col overflow-hidden rounded-lg bg-background p-3 text-left shadow-card transition-all duration-200 ease-out ${
        selected ? 'ring-2 ring-accent' : 'opacity-50 hover:opacity-100'
      }`}
    >
      <span
        className={`absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-recessed transition-colors ${
          selected ? 'bg-accent text-accent-foreground' : 'bg-background text-background'
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </span>

      <div className="flex aspect-[5/7] items-center justify-center overflow-hidden rounded-md bg-muted shadow-recessed">
        <img
          src={`${candidate.imageBase}/${PREVIEW_FALLBACK_SUFFIXES[0]}`}
          alt={`${candidate.name}, ${candidate.setName} ${candidate.number}`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget
            const nextIndex = Number(img.dataset.fallbackIndex ?? '0') + 1
            if (nextIndex < PREVIEW_FALLBACK_SUFFIXES.length) {
              img.dataset.fallbackIndex = String(nextIndex)
              img.src = `${candidate.imageBase}/${PREVIEW_FALLBACK_SUFFIXES[nextIndex]}`
            }
          }}
        />
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <p className="truncate text-xs font-semibold text-ink">{candidate.setName}</p>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          {candidate.number}
        </span>
        <span className="w-fit max-w-full rounded-md bg-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase leading-tight tracking-wider text-ink-muted shadow-recessed">
          {candidate.variant}
        </span>
      </div>
    </button>
  )
}
