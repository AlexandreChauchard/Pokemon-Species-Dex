import { Link } from 'react-router-dom'
import type { PokemonListEntry } from '../types/pokemon'

interface RankingRowProps {
  rank: number
  pokemon: PokemonListEntry
  count: number
  maxCount: number
}

export default function RankingRow({ rank, pokemon, count, maxCount }: RankingRowProps) {
  const displayName = pokemon.name.replace(/-/g, ' ')
  const percent = maxCount > 0 ? Math.max((count / maxCount) * 100, 4) : 0

  return (
    <Link
      to={`/pokemon/${pokemon.id}`}
      className="flex items-center gap-3 rounded-md px-2 py-3 transition hover:bg-muted/60 sm:gap-4 sm:px-3"
    >
      <span className="w-7 shrink-0 text-center font-mono text-xs font-bold text-ink-muted sm:w-10 sm:text-sm">
        #{rank}
      </span>
      <img
        src={pokemon.spriteUrl}
        alt={displayName}
        width={40}
        height={40}
        loading="lazy"
        style={{ imageRendering: 'pixelated' }}
        className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
      />
      <span className="w-20 shrink-0 truncate text-xs font-semibold capitalize text-ink sm:w-36 sm:text-sm">
        {displayName}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted shadow-recessed">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right font-mono text-[11px] font-bold text-ink-muted sm:w-20 sm:text-xs">
        {count} {count === 1 ? 'card' : 'cards'}
      </span>
    </Link>
  )
}
