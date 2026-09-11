import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, ImagePlus, Trash2, X } from 'lucide-react'
import FormField from './FormField'
import Button from './Button'
import { deleteCard, updateCard, uploadCardImage } from '../lib/cards'
import type { Card } from '../types/card'

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

interface EditCardModalProps {
  card: Card
  onClose: () => void
  onSaved: (card: Card) => void
  onDeleted: (id: string) => void
}

export default function EditCardModal({ card, onClose, onSaved, onDeleted }: EditCardModalProps) {
  const [setName, setSetName] = useState(card.set_name)
  const [number, setNumber] = useState(card.number)
  const [variant, setVariant] = useState(card.variant)
  const [language, setLanguage] = useState(card.language)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const imageUrl = imageFile ? await uploadCardImage(imageFile) : undefined
      const updated = await updateCard(card.id, {
        set_name: setName.trim(),
        number: number.trim(),
        variant: variant.trim(),
        language: language.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${card.set_name} card? This can't be undone.`)) return

    setError(null)
    setDeleting(true)
    try {
      await deleteCard(card)
      onDeleted(card.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-6 py-10 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-background p-8 shadow-floating"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Edit card</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:text-accent"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Image
            </label>
            <label
              htmlFor="editCardImage"
              className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-background shadow-recessed transition hover:brightness-95"
            >
              <img
                src={imagePreview ?? card.image_url}
                alt="Card preview"
                className="h-full w-auto rounded-md object-contain p-2"
              />
            </label>
            <input
              id="editCardImage"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            />
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted/70">
              <ImagePlus size={12} strokeWidth={2} />
              Click the image to replace it, or leave it as is.
            </p>
          </div>

          <FormField
            id="editSetName"
            label="Set"
            type="text"
            required
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
          />
          <FormField
            id="editNumber"
            label="Number"
            type="text"
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <FormField
            id="editVariant"
            label="Variant"
            type="text"
            required
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
          />
          <FormField
            id="editLanguage"
            label="Language"
            type="text"
            list="editLanguageOptions"
            required
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
          <datalist id="editLanguageOptions">
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

          <div className="mt-2 flex gap-3">
            <Button type="submit" disabled={saving || deleting} className="flex-1">
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </Button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} strokeWidth={2} />
            {deleting ? 'Deleting...' : 'Delete card'}
          </button>
        </form>
      </div>
    </div>
  )
}
