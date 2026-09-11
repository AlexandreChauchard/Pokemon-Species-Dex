import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, ImagePlus, PlusCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FormField from '../components/FormField'
import Button from '../components/Button'
import PokemonSearchSelect from '../components/PokemonSearchSelect'
import RequireAdmin from '../auth/RequireAdmin'
import { usePokemonList } from '../hooks/usePokemonList'
import { createCard, uploadCardImage } from '../lib/cards'
import type { PokemonListEntry } from '../types/pokemon'

const DRAFT_KEY = 'admin-add-card-draft'
const SCROLL_KEY = 'admin-add-card-scroll'

interface Draft {
  pokemon: PokemonListEntry | null
  setName: string
  number: string
  variant: string
  language: string
}

const COMMON_LANGUAGES = [
  'English',
  'Japanese',
  'French',
  'German',
  'Italian',
  'Spanish',
  'Portuguese',
  'Chinese',
  'Korean',
]

function loadDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) throw new Error('no draft')
    return JSON.parse(raw) as Draft
  } catch {
    return { pokemon: null, setName: '', number: '', variant: '', language: 'English' }
  }
}

function AdminAddCardForm() {
  const { pokemon: pokemonList } = usePokemonList()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialDraft = useRef(loadDraft())

  const [selectedPokemon, setSelectedPokemon] = useState<PokemonListEntry | null>(
    initialDraft.current.pokemon,
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [setName, setSetName] = useState(initialDraft.current.setName)
  const [number, setNumber] = useState(initialDraft.current.number)
  const [variant, setVariant] = useState(initialDraft.current.variant)
  const [language, setLanguage] = useState(initialDraft.current.language)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const draft: Draft = { pokemon: selectedPokemon, setName, number, variant, language }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [selectedPokemon, setName, number, variant, language])

  // Restore scroll position on mount, then keep it saved as the admin scrolls
  // so switching tabs and coming back doesn't jump back to the top.
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY)
    if (saved) window.scrollTo(0, Number(saved))

    const handleScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const clearForm = () => {
    setSelectedPokemon(null)
    clearImage()
    setSetName('')
    setNumber('')
    setVariant('')
    setLanguage('English')
    setError(null)
    setSuccess(false)
    sessionStorage.removeItem(DRAFT_KEY)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!selectedPokemon) {
      setError('Pick a Pokémon.')
      return
    }
    if (!imageFile) {
      setError('Add a card image.')
      return
    }

    setSubmitting(true)
    try {
      const imageUrl = await uploadCardImage(imageFile)
      await createCard({
        pokemon_id: selectedPokemon.id,
        pokemon_name: selectedPokemon.name,
        image_url: imageUrl,
        set_name: setName.trim(),
        number: number.trim(),
        variant: variant.trim(),
        language: language.trim(),
      })
      setSuccess(true)
      clearImage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 justify-center px-6 py-6 lg:py-8">
        <div className="w-full max-w-xl lg:max-w-4xl">
          <Link
            to="/admin"
            className="mb-4 inline-flex items-center gap-2 rounded-md bg-background px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted shadow-card transition-all duration-300 hover:text-accent active:translate-y-[2px] active:shadow-pressed lg:mb-6"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to admin
          </Link>

          <div className="rounded-2xl bg-background p-6 shadow-floating lg:p-8">
            <div className="mb-4 flex flex-col items-center gap-2 text-center lg:mb-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-recessed">
                <PlusCircle className="text-accent" size={22} strokeWidth={1.5} />
              </span>
              <h1 className="text-emboss text-2xl font-extrabold tracking-tight text-ink">
                Add a card
              </h1>
              <p className="text-sm text-ink-muted lg:hidden">
                Log a new card into the catalog.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Pokémon
                  </label>
                  <PokemonSearchSelect
                    pokemonList={pokemonList}
                    value={selectedPokemon}
                    onChange={setSelectedPokemon}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Image
                  </label>
                  <label
                    htmlFor="cardImage"
                    className="flex min-h-[150px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-background shadow-recessed transition hover:brightness-95"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Card preview"
                        className="h-full w-auto rounded-md object-contain p-2"
                      />
                    ) : (
                      <>
                        <ImagePlus className="text-ink-muted" size={28} strokeWidth={1.5} />
                        <span className="font-mono text-xs text-ink-muted">
                          Click to choose an image
                        </span>
                      </>
                    )}
                  </label>
                  <input
                    ref={fileInputRef}
                    id="cardImage"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                  />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted/70">
                    Everything else is saved as you type, but the image itself has to be
                    re-picked if the page reloads.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <FormField
                  id="setName"
                  label="Set"
                  type="text"
                  placeholder="e.g. Base Set"
                  required
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                />
                <FormField
                  id="number"
                  label="Number"
                  type="text"
                  placeholder="e.g. 4/102"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
                <FormField
                  id="variant"
                  label="Variant"
                  type="text"
                  placeholder="e.g. Holo"
                  required
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                />
                <FormField
                  id="language"
                  label="Language"
                  type="text"
                  placeholder="e.g. English"
                  list="languageOptions"
                  required
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
                <datalist id="languageOptions">
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} />
                  ))}
                </datalist>

                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-accent shadow-recessed">
                    <AlertTriangle size={16} strokeWidth={2} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-ink-muted shadow-recessed">
                    <CheckCircle2 size={16} strokeWidth={2} className="text-accent" />
                    Card added. Everything but the image is kept, ready for the next variant.
                  </div>
                )}

                <div className="mt-auto flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? 'Adding card...' : 'Add card'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={clearForm} disabled={submitting}>
                    Clear
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AdminAddCard() {
  return (
    <RequireAdmin>
      <AdminAddCardForm />
    </RequireAdmin>
  )
}
