import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import CardTile from './CardTile'
import type { Card } from '../types/card'

interface SortableCardTileProps {
  card: Card
  onEdit: (card: Card) => void
}

export default function SortableCardTile({ card, onEdit }: SortableCardTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute left-4 top-4 z-10 flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-full bg-background text-ink-muted opacity-0 shadow-floating transition-all duration-200 hover:text-accent group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical size={14} strokeWidth={2} />
      </button>
      <CardTile card={card} canEdit onEdit={onEdit} />
    </div>
  )
}
