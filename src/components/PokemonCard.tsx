import { Link } from 'react-router-dom'
import type { PokemonListEntry } from '../types/pokemon'

interface PokemonCardProps {
  pokemon: PokemonListEntry
  completed?: boolean
}

const CORNER_BASE = 'absolute h-1.5 w-1.5 rounded-full'
const CORNER_IDLE =
  'bg-ink/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),1px_1px_0_rgba(255,255,255,0.6)]'
const CORNER_COMPLETE = 'bg-emerald-500 shadow-glow-green'

export default function PokemonCard({ pokemon, completed = false }: PokemonCardProps) {
  const dexNumber = String(pokemon.id).padStart(3, '0')
  const displayName = pokemon.name.replace(/-/g, ' ')
  const cornerClass = `${CORNER_BASE} ${completed ? CORNER_COMPLETE : CORNER_IDLE}`

  return (
    <Link
      to={`/pokemon/${pokemon.id}`}
      className="group relative flex flex-col items-center rounded-lg bg-background p-4 pt-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-floating focus-visible:-translate-y-1 focus-visible:shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:shadow-pressed"
    >
      {/* Corner screws */}
      <span className={`${cornerClass} left-2.5 top-2.5`} />
      <span className={`${cornerClass} right-2.5 top-2.5`} />
      <span className={`${cornerClass} bottom-2.5 left-2.5`} />
      <span className={`${cornerClass} bottom-2.5 right-2.5`} />

      {/* Vent slots */}
      <div className="absolute right-4 top-4 flex gap-1">
        <span className="h-4 w-[3px] rounded-full bg-muted shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]" />
        <span className="h-4 w-[3px] rounded-full bg-muted shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]" />
        <span className="h-4 w-[3px] rounded-full bg-muted shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]" />
      </div>

      <span className="self-start rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-ink-muted shadow-recessed">
        #{dexNumber}
      </span>

      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background shadow-recessed transition-transform duration-300 ease-mechanical group-hover:scale-110">
        <img
          src={pokemon.spriteUrl}
          alt={displayName}
          loading="lazy"
          width={72}
          height={72}
          style={{ imageRendering: 'pixelated' }}
          className="h-[72px] w-[72px] object-contain drop-shadow-[2px_2px_2px_rgba(0,0,0,0.15)]"
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden'
          }}
        />
      </div>

      <span className="mt-3 truncate text-center text-sm font-semibold capitalize tracking-tight text-ink">
        {displayName}
      </span>
    </Link>
  )
}
