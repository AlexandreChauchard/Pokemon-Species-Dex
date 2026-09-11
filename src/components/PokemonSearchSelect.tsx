import { useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { PokemonListEntry } from '../types/pokemon'

interface PokemonSearchSelectProps {
  pokemonList: PokemonListEntry[]
  value: PokemonListEntry | null
  onChange: (pokemon: PokemonListEntry | null) => void
}

export default function PokemonSearchSelect({
  pokemonList,
  value,
  onChange,
}: PokemonSearchSelectProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pokemonList.slice(0, 8)

    const filtered = !Number.isNaN(Number(q))
      ? pokemonList.filter((p) => String(p.id).includes(q))
      : pokemonList.filter((p) => p.name.includes(q))

    return filtered.slice(0, 8)
  }, [pokemonList, query])

  const handleSelect = (pokemon: PokemonListEntry) => {
    onChange(pokemon)
    setQuery('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-md bg-background px-4 py-3 shadow-recessed">
        <img
          src={value.spriteUrl}
          alt={value.name}
          width={40}
          height={40}
          style={{ imageRendering: 'pixelated' }}
          className="h-10 w-10 object-contain"
        />
        <div className="flex-1">
          <p className="font-mono text-xs text-ink-muted">#{String(value.id).padStart(3, '0')}</p>
          <p className="text-sm font-semibold capitalize text-ink">{value.name.replace(/-/g, ' ')}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          aria-label="Change Pokémon"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:text-accent"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
        size={18}
        strokeWidth={1.5}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setIsOpen(false), 150)
        }}
        placeholder="Search by name or dex number..."
        className="h-14 w-full rounded-md border-none bg-background pl-11 pr-4 font-mono text-sm text-ink shadow-recessed outline-none placeholder:text-ink-muted/50 focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_#ff4757]"
      />

      {isOpen && matches.length > 0 && (
        <ul className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto rounded-md bg-background p-2 shadow-floating">
          {matches.map((pokemon) => (
            <li key={pokemon.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(pokemon)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-muted"
              >
                <img
                  src={pokemon.spriteUrl}
                  alt={pokemon.name}
                  width={32}
                  height={32}
                  style={{ imageRendering: 'pixelated' }}
                  className="h-8 w-8 object-contain"
                />
                <span className="font-mono text-xs text-ink-muted">
                  #{String(pokemon.id).padStart(3, '0')}
                </span>
                <span className="text-sm capitalize text-ink">
                  {pokemon.name.replace(/-/g, ' ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
