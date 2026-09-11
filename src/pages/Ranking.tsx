import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Loader2, Trophy } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LedIndicator from '../components/LedIndicator'
import RankingRow from '../components/RankingRow'
import { usePokemonList } from '../hooks/usePokemonList'
import { useCardCounts } from '../hooks/useCardCounts'

type SortDir = 'desc' | 'asc'

export default function Ranking() {
  const { pokemon, loading: pokemonLoading } = usePokemonList()
  const { counts, loading: countsLoading } = useCardCounts()
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const loading = pokemonLoading || countsLoading

  const ranked = useMemo(() => {
    const withCounts = pokemon
      .map((p) => ({ pokemon: p, count: counts.get(p.id) ?? 0 }))
      .filter((entry) => entry.count > 0)

    withCounts.sort((a, b) => (sortDir === 'desc' ? b.count - a.count : a.count - b.count))
    return withCounts
  }, [pokemon, counts, sortDir])

  const maxCount = ranked.length > 0 ? Math.max(...ranked.map((r) => r.count)) : 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <LedIndicator color="accent" label={`${ranked.length} species with cards`} />
            </div>
            <h1 className="text-emboss text-4xl font-extrabold tracking-tight text-ink">
              Card Ranking
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
              Every Pokémon with at least one card logged, ranked by how many you have
              catalogued.
            </p>
          </div>

          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-full bg-background p-1 shadow-recessed">
              <button
                type="button"
                onClick={() => setSortDir('desc')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition ${
                  sortDir === 'desc'
                    ? 'bg-accent text-accent-foreground shadow-accent-card'
                    : 'text-ink-muted hover:text-accent'
                }`}
              >
                <ArrowDownWideNarrow size={14} strokeWidth={2} />
                Most cards
              </button>
              <button
                type="button"
                onClick={() => setSortDir('asc')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition ${
                  sortDir === 'asc'
                    ? 'bg-accent text-accent-foreground shadow-accent-card'
                    : 'text-ink-muted hover:text-accent'
                }`}
              >
                <ArrowUpWideNarrow size={14} strokeWidth={2} />
                Fewest cards
              </button>
            </div>
          </div>

          <section className="rounded-2xl bg-background p-4 shadow-card sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="animate-spin text-accent" size={24} strokeWidth={2} />
                <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  Crunching numbers…
                </p>
              </div>
            ) : ranked.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-floating">
                  <Trophy className="text-accent" size={26} strokeWidth={1.5} />
                </span>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                  No cards logged yet
                </p>
                <p className="max-w-sm text-sm text-ink-muted">
                  Add a few cards to see the ranking take shape.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border-shadow/30">
                {ranked.map((entry, index) => (
                  <RankingRow
                    key={entry.pokemon.id}
                    rank={index + 1}
                    pokemon={entry.pokemon}
                    count={entry.count}
                    maxCount={maxCount}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
