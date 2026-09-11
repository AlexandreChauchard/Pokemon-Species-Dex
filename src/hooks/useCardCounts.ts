import { useEffect, useState } from 'react'
import { fetchCardCounts } from '../lib/cards'

interface State {
  counts: Map<number, number>
  loading: boolean
}

export function useCardCounts(): State {
  const [state, setState] = useState<State>({ counts: new Map(), loading: true })

  useEffect(() => {
    let cancelled = false

    fetchCardCounts()
      .then((counts) => {
        if (!cancelled) setState({ counts, loading: false })
      })
      .catch(() => {
        if (!cancelled) setState({ counts: new Map(), loading: false })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
