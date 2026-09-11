import { useEffect, useState } from 'react'
import { fetchAllPokemon } from '../lib/pokeapi'
import type { PokemonListEntry } from '../types/pokemon'

const CACHE_KEY = 'pokedex-cache-v1'

interface State {
  pokemon: PokemonListEntry[]
  loading: boolean
  error: string | null
}

export function usePokemonList(): State {
  const [state, setState] = useState<State>({ pokemon: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const pokemon: PokemonListEntry[] = JSON.parse(cached)
        setState({ pokemon, loading: false, error: null })
        return
      } catch {
        sessionStorage.removeItem(CACHE_KEY)
      }
    }

    fetchAllPokemon()
      .then((pokemon) => {
        if (cancelled) return
        setState({ pokemon, loading: false, error: null })
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(pokemon))
        } catch {
          /* storage full or unavailable, ignore */
        }
      })
      .catch((err: Error) => {
        if (cancelled) return
        setState({ pokemon: [], loading: false, error: err.message })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
