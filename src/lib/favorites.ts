import { supabase } from './supabaseClient'
import type { Favorite } from '../types/favorite'

export const MAX_FAVORITES = 10

export async function fetchFavorites(userId: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('id, user_id, pokemon_id, pokemon_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Favorite[]
}

export async function addFavorite(
  userId: string,
  pokemonId: number,
  pokemonName: string,
): Promise<Favorite> {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, pokemon_id: pokemonId, pokemon_name: pokemonName })
    .select()
    .single()

  if (error) {
    if (error.message.includes('up to 10')) {
      throw new Error('You can only favorite up to 10 Pokemon.')
    }
    if (error.code === '23505') {
      throw new Error('Already in your favorites.')
    }
    throw new Error(error.message)
  }
  return data as Favorite
}

export async function removeFavorite(id: string): Promise<void> {
  const { data, error } = await supabase.from('favorites').delete().eq('id', id).select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error("Remove didn't go through, please try again.")
  }
}
