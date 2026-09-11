import { useEffect, useState } from 'react'
import { fetchFavoriteCounts } from '../lib/favorites'

interface State {
  counts: Map<number, number>
  loading: boolean
  error: string | null
}

export function useFavoriteCounts(): State {
  const [state, setState] = useState<State>({ counts: new Map(), loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    fetchFavoriteCounts()
      .then((counts) => {
        if (!cancelled) setState({ counts, loading: false, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ counts: new Map(), loading: false, error: err.message })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
