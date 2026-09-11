import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import PokemonGrid from '../components/PokemonGrid'
import Footer from '../components/Footer'
import { usePokemonList } from '../hooks/usePokemonList'
import { useCompletedPokemon } from '../hooks/useCompletedPokemon'

export default function Home() {
  const { pokemon, loading, error } = usePokemonList()
  const completedIds = useCompletedPokemon()
  const [query, setQuery] = useState('')
  const [completedOnly, setCompletedOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = pokemon

    if (q) {
      const asNumber = Number(q)
      list =
        !Number.isNaN(asNumber) && q !== ''
          ? list.filter((p) => p.id === asNumber || String(p.id).includes(q))
          : list.filter((p) => p.name.includes(q))
    }

    if (completedOnly) {
      list = list.filter((p) => completedIds.has(p.id))
    }

    return list
  }, [pokemon, query, completedOnly, completedIds])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <Hero
          query={query}
          onQueryChange={setQuery}
          resultCount={filtered.length}
          totalCount={pokemon.length}
          completedOnly={completedOnly}
          onCompletedOnlyChange={setCompletedOnly}
          completedCount={completedIds.size}
        />

        <section className="px-6 pb-20 lg:px-12">
          <div className="mx-auto max-w-6xl">
            {loading && (
              <div className="flex flex-col items-center gap-4 py-24">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-floating">
                  <Loader2 className="animate-spin text-accent" size={28} strokeWidth={2} />
                </div>
                <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  Booting up Pokédex…
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg bg-background p-10 text-center shadow-recessed">
                <AlertTriangle className="text-accent" size={28} strokeWidth={1.5} />
                <p className="font-mono text-sm uppercase tracking-wide text-ink-muted">
                  Signal lost, could not reach PokéAPI
                </p>
                <p className="text-xs text-ink-muted">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <PokemonGrid pokemon={filtered} completedIds={completedIds} />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
