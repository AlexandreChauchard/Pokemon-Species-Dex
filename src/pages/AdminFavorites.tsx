import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Heart, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LedIndicator from '../components/LedIndicator'
import RankingRow from '../components/RankingRow'
import RequireAdmin from '../auth/RequireAdmin'
import { usePokemonList } from '../hooks/usePokemonList'
import { useFavoriteCounts } from '../hooks/useFavoriteCounts'
import { useCompletedPokemon } from '../hooks/useCompletedPokemon'

function AdminFavoritesPage() {
  const { pokemon, loading: pokemonLoading } = usePokemonList()
  const { counts, loading: countsLoading, error } = useFavoriteCounts()
  const completedIds = useCompletedPokemon()

  const loading = pokemonLoading || countsLoading

  const ranked = useMemo(() => {
    const withCounts = pokemon
      .map((p) => ({ pokemon: p, count: counts.get(p.id) ?? 0 }))
      .filter((entry) => entry.count > 0)

    withCounts.sort((a, b) => b.count - a.count)
    return withCounts
  }, [pokemon, counts])

  const maxCount = ranked.length > 0 ? Math.max(...ranked.map((r) => r.count)) : 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/admin"
            className="mb-6 inline-flex items-center gap-2 rounded-md bg-background px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted shadow-card transition-all duration-300 hover:text-accent active:translate-y-[2px] active:shadow-pressed"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to admin
          </Link>

          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <LedIndicator color="accent" label={`${ranked.length} species favorited`} />
            </div>
            <h1 className="text-emboss text-4xl font-extrabold tracking-tight text-ink">
              Favorites Ranking
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
              Every Pokémon favorited by at least one user, ranked by how many people are waiting
              on it. The check mark shows whether it's already completed.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-accent shadow-recessed">
              <AlertTriangle size={16} strokeWidth={2} />
              {error}
            </div>
          )}

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
                  <Heart className="text-accent" size={26} strokeWidth={1.5} />
                </span>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                  No favorites yet
                </p>
                <p className="max-w-sm text-sm text-ink-muted">
                  Once users start favoriting Pokémon, they'll show up here.
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
                    unitLabel="favorite"
                    completed={completedIds.has(entry.pokemon.id)}
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

export default function AdminFavorites() {
  return (
    <RequireAdmin>
      <AdminFavoritesPage />
    </RequireAdmin>
  )
}
