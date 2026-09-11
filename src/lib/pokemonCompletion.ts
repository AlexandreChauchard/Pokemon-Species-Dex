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
