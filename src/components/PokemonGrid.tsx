import { useEffect, useRef, useState } from 'react'
import { SearchX } from 'lucide-react'
import type { PokemonListEntry } from '../types/pokemon'
import PokemonCard from './PokemonCard'

const PAGE_SIZE = 48

interface PokemonGridProps {
  pokemon: PokemonListEntry[]
  completedIds: Set<number>
}

export default function PokemonGrid({ pokemon, completedIds }: PokemonGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [pokemon])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, pokemon.length))
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [pokemon.length])

  if (pokemon.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg bg-background p-10 text-center shadow-recessed">
        <SearchX className="text-ink-muted" size={32} strokeWidth={1.5} />
        <p className="font-mono text-sm uppercase tracking-wide text-ink-muted">
          No Pokémon matched that search
        </p>
      </div>
    )
  }

  const visible = pokemon.slice(0, visibleCount)

  return (
    <div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visible.map((p) => (
          <PokemonCard key={p.id} pokemon={p} completed={completedIds.has(p.id)} />
        ))}
      </div>
      {visibleCount < pokemon.length && (
        <div ref={sentinelRef} className="flex justify-center py-10">
          <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            Loading more…
          </span>
        </div>
      )}
    </div>
  )
}
