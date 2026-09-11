import { supabase } from './supabaseClient'
import { fetchCompletion } from './pokemonCompletion'
import type { Card, NewCardInput } from '../types/card'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export async function fetchCardsForPokemon(pokemonId: number): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(
      'id, pokemon_id, pokemon_name, image_url, set_name, number, variant, language, sort_order, created_at',
    )
    .eq('pokemon_id', pokemonId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Card[]
}

export async function fetchCardCounts(): Promise<Map<number, number>> {
  const { data, error } = await supabase.from('cards').select('pokemon_id').range(0, 9999)

  if (error) throw new Error(error.message)

  const counts = new Map<number, number>()
  for (const row of data) {
    const id = row.pokemon_id as number
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

export async function uploadCardImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be smaller than 5MB.')
  }

  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('card-images').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('card-images').getPublicUrl(path)
  return data.publicUrl
}

export async function createCard(input: NewCardInput): Promise<Card> {
  const { data, error } = await supabase.from('cards').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data as Card
}

// Best-effort, fire-and-forget: a failed notification shouldn't block or
// fail the card add itself. Only queues a notification for species that
// are ALREADY marked completed, adding cards to a still-in-progress
// checklist is routine and would just spam favoriters. The queue itself
// (flushed by a scheduled job once a species has been quiet a couple of
// minutes) is what collapses several adds in a row into one email instead
// of one per card, see supabase/notification_batching.sql.
export async function notifyOfNewCards(
  pokemonId: number,
  pokemonName: string,
  cardCount = 1,
): Promise<void> {
  try {
    const completed = await fetchCompletion(pokemonId)
    if (!completed) return

    const { error } = await supabase.rpc('queue_card_notification', {
      p_pokemon_id: pokemonId,
      p_pokemon_name: pokemonName,
      p_card_count: cardCount,
    })
    if (error) throw error
  } catch (err) {
    console.error('Failed to queue card notification:', err)
  }
}

export type CardUpdate = Partial<
  Pick<NewCardInput, 'set_name' | 'number' | 'variant' | 'language' | 'image_url'>
>

export async function updateCard(id: string, updates: CardUpdate): Promise<Card> {
  const { data, error } = await supabase.from('cards').update(updates).eq('id', id).select()

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error("Save didn't go through, you may not have permission to edit this card.")
  }
  return data[0] as Card
}

export async function reorderCards(orderedCards: Card[]): Promise<void> {
  const results = await Promise.all(
    orderedCards.map((card, index) =>
      supabase.from('cards').update({ sort_order: index }).eq('id', card.id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)
}

export async function deleteCard(card: Card): Promise<void> {
  const { data, error } = await supabase.from('cards').delete().eq('id', card.id).select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error("Delete didn't go through, you may not have permission to remove this card.")
  }

  const marker = '/card-images/'
  const markerIndex = card.image_url.indexOf(marker)
  if (markerIndex !== -1) {
    const path = card.image_url.slice(markerIndex + marker.length)
    await supabase.storage.from('card-images').remove([path])
  }
}
