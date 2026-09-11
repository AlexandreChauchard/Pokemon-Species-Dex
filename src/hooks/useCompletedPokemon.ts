import { useEffect, useState } from 'react'
import { fetchCompletedPokemonIds } from '../lib/pokemonCompletion'

export function useCompletedPokemon(): Set<number> {
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false

    fetchCompletedPokemonIds()
      .then((ids) => {
        if (!cancelled) setCompletedIds(ids)
      })
      .catch(() => {
        if (!cancelled) setCompletedIds(new Set())
      })

    return () => {
      cancelled = true
    }
  }, [])

  return completedIds
}
