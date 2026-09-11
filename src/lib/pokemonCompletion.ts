import { supabase } from './supabaseClient'

export async function fetchCompletedPokemonIds(): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('pokemon_completion')
    .select('pokemon_id')
    .eq('completed', true)

  if (error) throw new Error(error.message)
  return new Set(data.map((row) => row.pokemon_id as number))
}

export async function fetchCompletion(pokemonId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('pokemon_completion')
    .select('completed')
    .eq('pokemon_id', pokemonId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.completed ?? false
}

export async function setCompletion(pokemonId: number, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('pokemon_completion')
    .upsert({ pokemon_id: pokemonId, completed, updated_at: new Date().toISOString() })

  if (error) throw new Error(error.message)
}

// Best-effort, fire-and-forget, mirrors notifyOfNewCards in cards.ts. Also
// clears any pending (not-yet-flushed) card-add batch for this species, so
// cards added just before completion don't also trigger a separate "N new
// cards" email covering the same additions right after this one.
export async function notifyFavoritesOfCompletion(
  pokemonId: number,
  pokemonName: string,
): Promise<void> {
  try {
    await supabase.functions.invoke('notify-favorite-card', {
      body: { pokemonId, pokemonName },
    })
    await supabase.rpc('clear_pending_card_notifications', { p_pokemon_id: pokemonId })
  } catch (err) {
    console.error('Failed to notify favorites of completion:', err)
  }
}
