import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Loader2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CardTile from '../components/CardTile'
import SortableCardTile from '../components/SortableCardTile'
import EditCardModal from '../components/EditCardModal'
import Switch from '../components/Switch'
import { useAuth } from '../auth/AuthContext'
import { fetchPokemonDetail, spriteUrlFor } from '../lib/pokeapi'
import { fetchCardsForPokemon, reorderCards } from '../lib/cards'
import { fetchCompletion, setCompletion } from '../lib/pokemonCompletion'
import type { PokemonDetail as PokemonDetailType } from '../types/pokemon'
import type { Card } from '../types/card'

interface LanguageGroup {
  language: string
  cards: Card[]
}

function groupCardsByLanguage(cards: Card[]): LanguageGroup[] {
  const groups = new Map<string, Card[]>()
  for (const card of cards) {
    const existing = groups.get(card.language)
    if (existing) {
      existing.push(card)
    } else {
      groups.set(card.language, [card])
    }
  }

  return Array.from(groups, ([language, cards]) => ({ language, cards })).sort((a, b) => {
    if (a.language === 'English') return -1
    if (b.language === 'English') return 1
    return a.language.localeCompare(b.language)
  })
}

export default function PokemonDetail() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const { isAdmin } = useAuth()

  const [detail, setDetail] = useState<PokemonDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cards, setCards] = useState<Card[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)

  const [completed, setCompleted] = useState(false)
  const [savingCompletion, setSavingCompletion] = useState(false)

  const [editingCard, setEditingCard] = useState<Card | null>(null)

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const handleDragEnd = (group: LanguageGroup) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = group.cards.findIndex((c) => c.id === active.id)
    const newIndex = group.cards.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(group.cards, oldIndex, newIndex)

    setCards((prev) => {
      const others = prev.filter((c) => c.language !== group.language)
      return [...others, ...reordered]
    })

    reorderCards(reordered).catch(() => {
      // Best-effort persistence: local order already reflects the drag,
      // a refresh will just fall back to whatever order did save.
    })
  }

  useEffect(() => {
    if (!Number.isFinite(numericId)) return
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchPokemonDetail(numericId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [numericId])

  useEffect(() => {
    if (!Number.isFinite(numericId)) return
    let cancelled = false
    setCardsLoading(true)

    fetchCardsForPokemon(numericId)
      .then((data) => {
        if (!cancelled) setCards(data)
      })
      .catch(() => {
        if (!cancelled) setCards([])
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [numericId])

  useEffect(() => {
    if (!Number.isFinite(numericId)) return
    let cancelled = false

    fetchCompletion(numericId)
      .then((value) => {
        if (!cancelled) setCompleted(value)
      })
      .catch(() => {
        if (!cancelled) setCompleted(false)
      })

    return () => {
      cancelled = true
    }
  }, [numericId])

  const handleToggleCompleted = async (next: boolean) => {
    setCompleted(next)
    setSavingCompletion(true)
    try {
      await setCompletion(numericId, next)
    } catch {
      setCompleted(!next)
    } finally {
      setSavingCompletion(false)
    }
  }

  const dexNumber = String(numericId).padStart(3, '0')
  const rawName = detail?.name.replace(/-/g, ' ') ?? '…'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const languageGroups = groupCardsByLanguage(cards)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-6 py-12 lg:px-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 rounded-md bg-background px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted shadow-card transition-all duration-300 hover:text-accent active:translate-y-[2px] active:shadow-pressed"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Pokédex
        </Link>

        {loading && (
          <div className="flex flex-col items-center gap-4 py-24">
            <Loader2 className="animate-spin text-accent" size={28} strokeWidth={2} />
            <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Retrieving record…
            </p>
          </div>
        )}

        {error && !loading && (
          <p className="rounded-lg bg-background p-8 text-center font-mono text-sm text-ink-muted shadow-recessed">
            Could not load this Pokémon: {error}
          </p>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-6">
            <section className="relative flex flex-col items-center rounded-2xl bg-background p-10 shadow-floating">
              <span className="absolute left-6 top-6 rounded-sm bg-muted px-2 py-1 font-mono text-xs font-bold tracking-wider text-ink-muted shadow-recessed">
                #{dexNumber}
              </span>

              {isAdmin && (
                <div className="absolute right-6 top-6 flex items-center gap-2 rounded-md bg-background px-3 py-2 shadow-recessed">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    Completed
                  </span>
                  <Switch
                    checked={completed}
                    onChange={handleToggleCompleted}
                    disabled={savingCompletion}
                  />
                </div>
              )}

              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-background shadow-recessed">
                <img
                  src={detail?.spriteUrl ?? spriteUrlFor(numericId)}
                  alt={displayName}
                  width={112}
                  height={112}
                  style={{ imageRendering: 'pixelated' }}
                  className="h-28 w-28 object-contain drop-shadow-[3px_3px_3px_rgba(0,0,0,0.2)]"
                />
              </div>

              <h1 className="text-emboss mt-6 text-3xl font-extrabold capitalize tracking-tight text-ink">
                {displayName}
              </h1>

              {detail && detail.types.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {detail.types.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-muted px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted shadow-recessed"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {cardsLoading ? (
              <section className="relative overflow-hidden rounded-2xl bg-background p-10 shadow-card lg:min-h-[420px] lg:p-12">
                <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="animate-spin text-accent" size={24} strokeWidth={2} />
                  <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                    Loading cards…
                  </p>
                </div>
              </section>
            ) : languageGroups.length === 0 ? (
              <section className="relative overflow-hidden rounded-2xl bg-background p-10 shadow-card lg:min-h-[420px] lg:p-12">
                <div className="bg-scanlines relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden text-center">
                  <div className="pointer-events-none absolute inset-0 opacity-[0.06]" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-floating">
                    <Layers className="text-accent" size={26} strokeWidth={1.5} />
                  </span>
                  <p className="relative font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                    No cards logged yet
                  </p>
                  <p className="relative max-w-sm text-sm leading-relaxed text-ink-muted">
                    No English prints of {displayName} have been added to the catalog yet.
                  </p>
                </div>
              </section>
            ) : (
              languageGroups.map((group) => (
                <section
                  key={group.language}
                  className="relative overflow-hidden rounded-2xl bg-background p-10 shadow-card lg:p-12"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <h2 className="text-lg font-bold text-ink">{group.language}</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted shadow-recessed">
                      {group.cards.length} {group.cards.length === 1 ? 'card' : 'cards'}
                    </span>
                  </div>
                  {isAdmin ? (
                    <DndContext
                      sensors={dragSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd(group)}
                    >
                      <SortableContext
                        items={group.cards.map((c) => c.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                          {group.cards.map((card) => (
                            <SortableCardTile key={card.id} card={card} onEdit={setEditingCard} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {group.cards.map((card) => (
                        <CardTile key={card.id} card={card} />
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </div>
        )}
      </main>

      <Footer />

      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSaved={(updated) => {
            setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
          }}
          onDeleted={(id) => {
            setCards((prev) => prev.filter((c) => c.id !== id))
          }}
        />
      )}
    </div>
  )
}
