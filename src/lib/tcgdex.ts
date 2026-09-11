const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en'

// A handful of species whose PokeAPI slug doesn't turn back into a name
// TCGdex's search will actually match (punctuation, symbols, or a hyphen
// that must be kept instead of turned into a space).
const NAME_OVERRIDES: Record<string, string> = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'mr-mime': 'Mr. Mime',
  'mr-rime': 'Mr. Rime',
  'mime-jr': 'Mime Jr.',
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'type-null': 'Type: Null',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  flabebe: 'Flabébé',
  'tapu-koko': 'Tapu Koko',
  'tapu-lele': 'Tapu Lele',
  'tapu-bulu': 'Tapu Bulu',
  'tapu-fini': 'Tapu Fini',
}

export function toTcgSearchName(pokemonSlug: string): string {
  const override = NAME_OVERRIDES[pokemonSlug]
  if (override) return override

  return pokemonSlug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

interface TcgdexCardBrief {
  id: string
  name: string
  image?: string
}

interface TcgdexVariants {
  firstEdition?: boolean
  holo?: boolean
  normal?: boolean
  reverse?: boolean
  wPromo?: boolean
}

interface TcgdexCardDetail {
  id: string
  name: string
  category: string
  image?: string
  localId: string
  set: { name: string; cardCount: { official: number; total: number } }
  variants?: TcgdexVariants
}

export interface TcgdexCandidate {
  key: string
  cardId: string
  name: string
  setName: string
  number: string
  variant: string
  imageBase: string
}

// Not every card has every quality/format combo (older or digital-only
// sets are inconsistent about it), so try a few before giving up. A missing
// asset 404s with no CORS header, which the browser reports as a CORS
// error rather than a 404, so this can't be told apart from a real outage
// without just trying the next candidate.
export const IMAGE_FALLBACK_SUFFIXES = ['high.webp', 'high.png', 'low.webp', 'low.png']

const VARIANT_LABELS: Record<keyof TcgdexVariants, string> = {
  normal: 'Normal',
  holo: 'Holo',
  reverse: 'Reverse',
  firstEdition: '1st Edition',
  wPromo: 'Promo',
}

function expandVariants(variants: TcgdexVariants | undefined): string[] {
  const active = (Object.keys(VARIANT_LABELS) as (keyof TcgdexVariants)[])
    .filter((key) => variants?.[key])
    .map((key) => VARIANT_LABELS[key])

  return active.length > 0 ? active : ['Normal']
}

// TCGdex's search endpoint is a plain substring match, so searching "Porygon"
// also returns "Porygon2" and "Porygon-Z" cards (and "Dark Porygon2", etc).
// Only keep cards where the species name appears as its own whole token (or
// contiguous run of tokens, for multi-word names), splitting on spaces only
// so a hyphenated name like "Porygon-Z" never partially matches "Porygon".
function cardNameMatchesSpecies(cardName: string, searchName: string): boolean {
  // The older XY-era EX cards are hyphenated ("Pikachu-EX", "Ho-Oh-EX")
  // instead of spaced, which would otherwise look just like a real
  // different-species suffix ("Porygon-Z"). Split that one specific suffix
  // back into its own token before comparing.
  const normalized = cardName.replace(/-(EX|GX)$/i, ' $1')
  const cardTokens = normalized.split(' ')
  const searchTokens = searchName.split(' ')
  for (let i = 0; i <= cardTokens.length - searchTokens.length; i++) {
    if (searchTokens.every((t, j) => cardTokens[i + j].toLowerCase() === t.toLowerCase())) {
      return true
    }
  }
  return false
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export async function fetchTcgdexCandidates(pokemonSlug: string): Promise<TcgdexCandidate[]> {
  const searchName = toTcgSearchName(pokemonSlug)
  const searchRes = await fetch(`${TCGDEX_BASE}/cards?name=${encodeURIComponent(searchName)}`)
  if (!searchRes.ok) throw new Error('Could not reach TCGdex.')

  const briefs = (await searchRes.json()) as TcgdexCardBrief[]
  const withImages = briefs.filter(
    (brief) => brief.image && cardNameMatchesSpecies(brief.name, searchName),
  )

  const details = await mapWithConcurrency(withImages, 6, async (brief) => {
    try {
      const res = await fetch(`${TCGDEX_BASE}/cards/${brief.id}`)
      if (!res.ok) return null
      return (await res.json()) as TcgdexCardDetail
    } catch {
      return null
    }
  })

  const candidates: TcgdexCandidate[] = []
  for (const card of details) {
    if (!card || card.category !== 'Pokemon' || !card.image) continue
    // TCG Pocket (the mobile app's digital-only cards) uses the "tcgp"
    // series in its asset path and isn't a real physical set, so it's
    // excluded from bulk add.
    if (card.image.includes('/tcgp/')) continue

    const number = `${card.localId}/${card.set.cardCount.official}`
    for (const variant of expandVariants(card.variants)) {
      candidates.push({
        key: `${card.id}-${variant}`,
        cardId: card.id,
        name: card.name,
        setName: card.set.name,
        number,
        variant,
        imageBase: card.image,
      })
    }
  }

  candidates.sort((a, b) => a.setName.localeCompare(b.setName) || a.number.localeCompare(b.number))
  return candidates
}

async function fetchImageAsFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Image not available (${res.status})`)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

// TCGdex's CDN occasionally sends a malformed response for a given asset
// (duplicate Access-Control-Allow-Origin headers, which browsers reject
// outright) that isn't consistent across requests, so a couple of retries
// with a cache-busting query param before moving on to the next format
// noticeably improves the odds of getting a usable response.
async function fetchImageWithRetry(url: string, filename: string, attempts = 3): Promise<File> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < attempts; attempt++) {
    const attemptUrl = attempt === 0 ? url : `${url}?retry=${attempt}-${Date.now()}`
    try {
      return await fetchImageAsFile(attemptUrl, filename)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error')
    }
  }
  throw lastError ?? new Error('Unknown error')
}

export async function fetchBestCardImage(imageBase: string, filename: string): Promise<File> {
  let lastError: Error | null = null
  for (const suffix of IMAGE_FALLBACK_SUFFIXES) {
    try {
      return await fetchImageWithRetry(`${imageBase}/${suffix}`, filename)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error')
    }
  }
  throw lastError ?? new Error('No usable image found for this card.')
}
