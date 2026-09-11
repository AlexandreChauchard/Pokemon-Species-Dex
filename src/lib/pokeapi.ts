import type { PokemonDetail, PokemonListEntry } from '../types/pokemon'

const POKEAPI_LIST_URL = 'https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0'
const POKEAPI_DETAIL_URL = 'https://pokeapi.co/api/v2/pokemon'
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export const spriteUrlFor = (id: number) => `${SPRITE_BASE_URL}/${id}.png`

const idFromUrl = (url: string): number => {
  const match = url.match(/\/pokemon\/(\d+)\//)
  return match ? Number(match[1]) : 0
}

export async function fetchAllPokemon(): Promise<PokemonListEntry[]> {
  const res = await fetch(POKEAPI_LIST_URL)
  if (!res.ok) {
    throw new Error(`PokeAPI request failed: ${res.status}`)
  }
  const data: { results: { name: string; url: string }[] } = await res.json()

  return data.results
    .map(({ name, url }) => {
      const id = idFromUrl(url)
      return { id, name, spriteUrl: spriteUrlFor(id) }
    })
    .sort((a, b) => a.id - b.id)
}

export async function fetchPokemonDetail(id: number): Promise<PokemonDetail> {
  const res = await fetch(`${POKEAPI_DETAIL_URL}/${id}`)
  if (!res.ok) {
    throw new Error(`PokeAPI request failed: ${res.status}`)
  }
  const data: { id: number; name: string; types: { type: { name: string } }[] } = await res.json()

  return {
    id: data.id,
    name: data.name,
    spriteUrl: spriteUrlFor(data.id),
    types: data.types.map((t) => t.type.name),
  }
}
