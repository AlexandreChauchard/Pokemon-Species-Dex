import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Layers, Loader2, PackageSearch } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import PokemonSearchSelect from '../components/PokemonSearchSelect'
import TcgdexCandidateTile from '../components/TcgdexCandidateTile'
import RequireAdmin from '../auth/RequireAdmin'
import { usePokemonList } from '../hooks/usePokemonList'
import { createCard, notifyFavoritesOfNewCard, uploadCardImage } from '../lib/cards'
import { fetchBestCardImage, fetchTcgdexCandidates } from '../lib/tcgdex'
import type { PokemonListEntry } from '../types/pokemon'
import type { TcgdexCandidate } from '../lib/tcgdex'

interface ImportFailure {
  key: string
  label: string
  reason: string
}

function AdminBulkAddCardsPage() {
  const { pokemon: pokemonList } = usePokemonList()

  const [selectedPokemon, setSelectedPokemon] = useState<PokemonListEntry | null>(null)
  const [candidates, setCandidates] = useState<TcgdexCandidate[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    added: number
    failures: ImportFailure[]
  } | null>(null)

  const resetResults = () => {
    setCandidates([])
    setSelectedKeys(new Set())
    setFetchError(null)
    setImportResult(null)
    setHasSearched(false)
  }

  const handleSelectPokemon = (pokemon: PokemonListEntry | null) => {
    setSelectedPokemon(pokemon)
    resetResults()
  }

  const handleFetch = async () => {
    if (!selectedPokemon) return
    setFetching(true)
    setFetchError(null)
    setImportResult(null)
    setCandidates([])
    setSelectedKeys(new Set())
    setHasSearched(true)

    try {
      const results = await fetchTcgdexCandidates(selectedPokemon.name)
      setCandidates(results)
      setSelectedKeys(new Set(results.map((c) => c.key)))
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setFetching(false)
    }
  }

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => setSelectedKeys(new Set(candidates.map((c) => c.key)))
  const selectNone = () => setSelectedKeys(new Set())

  const selectedCandidates = useMemo(
    () => candidates.filter((c) => selectedKeys.has(c.key)),
    [candidates, selectedKeys],
  )

  const handleImport = async () => {
    if (!selectedPokemon || selectedCandidates.length === 0) return
    const pokemon = selectedPokemon
    setImporting(true)
    setImportProgress(0)
    setImportResult(null)

    const failures: ImportFailure[] = []
    let added = 0
    let cursor = 0
    const concurrency = 3

    async function worker() {
      while (cursor < selectedCandidates.length) {
        const index = cursor++
        const candidate = selectedCandidates[index]
        try {
          const file = await fetchBestCardImage(candidate.imageBase, `${candidate.cardId}.png`)
          const imageUrl = await uploadCardImage(file)
          await createCard({
            pokemon_id: pokemon.id,
            pokemon_name: pokemon.name,
            image_url: imageUrl,
            set_name: candidate.setName,
            number: candidate.number,
            variant: candidate.variant,
            language: 'English',
          })
          added++
        } catch (err) {
          failures.push({
            key: candidate.key,
            label: `${candidate.setName} ${candidate.number} (${candidate.variant})`,
            reason: err instanceof Error ? err.message : 'Unknown error',
          })
        } finally {
          setImportProgress((prev) => prev + 1)
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(concurrency, selectedCandidates.length) }, worker),
    )

    if (added > 0) {
      void notifyFavoritesOfNewCard(pokemon.id, pokemon.name, added)
    }

    setImportResult({ added, failures })
    setImporting(false)
    setCandidates((prev) =>
      prev.filter((c) => failures.some((f) => f.key === c.key) || !selectedKeys.has(c.key)),
    )
    setSelectedKeys(new Set())
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/admin"
            className="mb-6 inline-flex items-center gap-2 rounded-md bg-background px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted shadow-card transition-all duration-300 hover:text-accent active:translate-y-[2px] active:shadow-pressed"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to admin
          </Link>

          <div className="rounded-2xl bg-background p-8 shadow-floating">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-recessed">
                <PackageSearch className="text-accent" size={22} strokeWidth={1.5} />
              </span>
              <h1 className="text-emboss text-2xl font-extrabold tracking-tight text-ink">
                Bulk add cards
              </h1>
              <p className="max-w-md text-sm text-ink-muted">
                Pick a Pokémon, pull every card TCGdex knows about it, and choose which ones to
                add.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Pokémon
                </label>
                <PokemonSearchSelect
                  pokemonList={pokemonList}
                  value={selectedPokemon}
                  onChange={handleSelectPokemon}
                />
              </div>
              <Button
                type="button"
                onClick={handleFetch}
                disabled={!selectedPokemon || fetching}
                className="sm:h-14"
              >
                {fetching ? 'Fetching...' : 'Fetch from TCGdex'}
              </Button>
            </div>

            {fetchError && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-accent shadow-recessed">
                <AlertTriangle size={16} strokeWidth={2} />
                {fetchError}
              </div>
            )}

            {importResult && (
              <div className="mt-4 flex flex-col gap-2 rounded-md bg-muted px-4 py-3 shadow-recessed">
                <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
                  <CheckCircle2 size={16} strokeWidth={2} className="text-accent" />
                  Added {importResult.added} {importResult.added === 1 ? 'card' : 'cards'}.
                  {importResult.failures.length > 0 &&
                    ` ${importResult.failures.length} failed, still shown below to retry.`}
                </div>
                {importResult.failures.length > 0 && (
                  <ul className="ml-6 list-disc font-mono text-[11px] text-accent">
                    {importResult.failures.map((f) => (
                      <li key={f.key}>
                        {f.label}: {f.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {fetching && (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="animate-spin text-accent" size={24} strokeWidth={2} />
                <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  Talking to TCGdex…
                </p>
              </div>
            )}

            {!fetching && hasSearched && candidates.length === 0 && !fetchError && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-floating">
                  <Layers className="text-accent" size={26} strokeWidth={1.5} />
                </span>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                  No cards found
                </p>
                <p className="max-w-sm text-sm text-ink-muted">
                  TCGdex doesn't have any Pokémon-category cards matching this species.
                </p>
              </div>
            )}

            {candidates.length > 0 && (
              <>
                <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-shadow/30 pt-6">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                    {selectedKeys.size} of {candidates.length} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={selectAll}
                      className="h-9 px-3 text-[11px]"
                      disabled={importing}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={selectNone}
                      className="h-9 px-3 text-[11px]"
                      disabled={importing}
                    >
                      Select none
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {candidates.map((candidate) => (
                    <TcgdexCandidateTile
                      key={candidate.key}
                      candidate={candidate}
                      selected={selectedKeys.has(candidate.key)}
                      onToggle={toggleKey}
                    />
                  ))}
                </div>

                <div className="sticky bottom-6 mt-8 flex flex-col items-center gap-3 rounded-2xl bg-background p-4 shadow-floating sm:flex-row sm:justify-between">
                  <p className="font-mono text-xs text-ink-muted">
                    {importing
                      ? `Adding ${importProgress} of ${selectedCandidates.length}…`
                      : `Ready to add ${selectedKeys.size} card${selectedKeys.size === 1 ? '' : 's'}.`}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleSelectPokemon(null)}
                      disabled={importing}
                    >
                      Start over
                    </Button>
                    <Button
                      type="button"
                      onClick={handleImport}
                      disabled={importing || selectedKeys.size === 0}
                    >
                      {importing
                        ? 'Adding...'
                        : `Add ${selectedKeys.size} card${selectedKeys.size === 1 ? '' : 's'}`}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AdminBulkAddCards() {
  return (
    <RequireAdmin>
      <AdminBulkAddCardsPage />
    </RequireAdmin>
  )
}
