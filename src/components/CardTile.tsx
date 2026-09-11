import { Pencil } from 'lucide-react'
import type { Card } from '../types/card'

interface CardTileProps {
  card: Card
  canEdit?: boolean
  onEdit?: (card: Card) => void
}

export default function CardTile({ card, canEdit = false, onEdit }: CardTileProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-background p-3 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-floating">
      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit?.(card)}
          aria-label="Edit card"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background text-ink-muted opacity-0 shadow-floating transition-all duration-200 hover:text-accent group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Pencil size={14} strokeWidth={2} />
        </button>
      )}

      <div className="flex aspect-[5/7] items-center justify-center overflow-hidden rounded-md bg-muted shadow-recessed">
        <img
          src={card.image_url}
          alt={`${card.pokemon_name}, ${card.set_name} ${card.number}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <p className="truncate text-sm font-semibold text-ink">{card.set_name}</p>
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          {card.number}
        </span>
        <span className="w-fit max-w-full rounded-md bg-muted px-2 py-1 font-mono text-[10px] font-bold uppercase leading-tight tracking-wider text-ink-muted shadow-recessed">
          {card.variant}
        </span>
      </div>
    </div>
  )
}
