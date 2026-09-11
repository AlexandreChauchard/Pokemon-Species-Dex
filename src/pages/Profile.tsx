import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Heart, ImagePlus, Loader2, Star, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FormField from '../components/FormField'
import Button from '../components/Button'
import PokemonSearchSelect from '../components/PokemonSearchSelect'
import RequireAuth from '../auth/RequireAuth'
import { useAuth } from '../auth/AuthContext'
import { usePokemonList } from '../hooks/usePokemonList'
import { uploadAvatar, updateOwnProfile } from '../lib/profile'
import { MAX_FAVORITES, addFavorite, fetchFavorites, removeFavorite } from '../lib/favorites'
import type { Favorite } from '../types/favorite'
import type { PokemonListEntry } from '../types/pokemon'

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { pokemon: pokemonList } = usePokemonList()

  const [username, setUsername] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoritesError, setFavoritesError] = useState<string | null>(null)
  const [addingFavorite, setAddingFavorite] = useState(false)

  useEffect(() => {
    setUsername(profile?.username ?? '')
  }, [profile?.username])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchFavorites(user.id)
      .then((data) => {
        if (!cancelled) setFavorites(data)
      })
      .catch((err) => {
        if (!cancelled) setFavoritesError(err instanceof Error ? err.message : 'Something went wrong.')
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) return null

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return
    setProfileError(null)
    setProfileSaved(false)
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    setSavingProfile(true)
    try {
      const avatarUrl = await uploadAvatar(user.id, file)
      await updateOwnProfile({ avatarUrl })
      await refreshProfile()
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveUsername = async () => {
    setProfileError(null)
    setProfileSaved(false)
    setSavingProfile(true)
    try {
      await updateOwnProfile({ username: username.trim() || null })
      await refreshProfile()
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddFavorite = async (pokemon: PokemonListEntry | null) => {
    if (!pokemon) return
    setFavoritesError(null)
    setAddingFavorite(true)
    try {
      const favorite = await addFavorite(user.id, pokemon.id, pokemon.name)
      setFavorites((prev) => [...prev, favorite])
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setAddingFavorite(false)
    }
  }

  const handleRemoveFavorite = async (favorite: Favorite) => {
    setFavoritesError(null)
    try {
      await removeFavorite(favorite.id)
      setFavorites((prev) => prev.filter((f) => f.id !== favorite.id))
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const spriteFor = (pokemonId: number) =>
    pokemonList.find((p) => p.id === pokemonId)?.spriteUrl ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`

  const avatarSrc = avatarPreview ?? profile?.avatar_url ?? null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-6 py-10 lg:px-12 lg:py-14">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div>
            <h1 className="text-emboss text-3xl font-extrabold tracking-tight text-ink">Profile</h1>
            <p className="mt-1 text-sm text-ink-muted">{profile?.email}</p>
          </div>

          <section className="rounded-2xl bg-background p-8 shadow-floating">
            <h2 className="mb-6 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
              Picture &amp; username
            </h2>

            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <label
                htmlFor="avatarInput"
                className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-background shadow-recessed"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Your avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                    No photo
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-transparent transition group-hover:bg-ink/40 group-hover:text-white">
                  <ImagePlus size={20} strokeWidth={2} />
                </span>
              </label>
              <input
                id="avatarInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
              />

              <div className="flex w-full flex-1 flex-col gap-3">
                <FormField
                  id="username"
                  label="Username"
                  type="text"
                  maxLength={40}
                  placeholder="Trainer name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleSaveUsername}
                  disabled={savingProfile}
                  className="self-start"
                >
                  {savingProfile ? 'Saving...' : 'Save username'}
                </Button>
              </div>
            </div>

            {profileError && (
              <div className="mt-5 flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-accent shadow-recessed">
                <AlertTriangle size={16} strokeWidth={2} />
                {profileError}
              </div>
            )}
            {profileSaved && !profileError && (
              <p className="mt-5 font-mono text-xs uppercase tracking-wider text-ink-muted">
                Saved.
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-background p-8 shadow-floating">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                <Heart size={14} strokeWidth={2} className="text-accent" />
                Favorite Pokémon
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted shadow-recessed">
                {favorites.length}/{MAX_FAVORITES}
              </span>
            </div>

            <p className="mb-5 text-sm text-ink-muted">
              Get an email whenever a new card is added for one of these.
            </p>

            {favorites.length < MAX_FAVORITES ? (
              <PokemonSearchSelect pokemonList={pokemonList} value={null} onChange={handleAddFavorite} />
            ) : (
              <p className="rounded-md bg-muted px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink-muted shadow-recessed">
                You've reached the {MAX_FAVORITES} favorite limit.
              </p>
            )}
            {addingFavorite && (
              <p className="mt-2 flex items-center gap-2 font-mono text-xs text-ink-muted">
                <Loader2 size={12} className="animate-spin" /> Adding...
              </p>
            )}

            {favoritesError && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-accent shadow-recessed">
                <AlertTriangle size={16} strokeWidth={2} />
                {favoritesError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              {favoritesLoading && (
                <p className="flex items-center gap-2 font-mono text-xs text-ink-muted">
                  <Loader2 size={12} className="animate-spin" /> Loading favorites...
                </p>
              )}

              {!favoritesLoading && favorites.length === 0 && (
                <p className="flex items-center gap-2 rounded-md bg-muted px-4 py-6 font-mono text-xs uppercase tracking-wider text-ink-muted shadow-recessed">
                  <Star size={14} strokeWidth={2} />
                  No favorites yet.
                </p>
              )}

              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="flex items-center gap-3 rounded-md bg-background px-4 py-3 shadow-recessed"
                >
                  <img
                    src={spriteFor(favorite.pokemon_id)}
                    alt={favorite.pokemon_name}
                    width={36}
                    height={36}
                    style={{ imageRendering: 'pixelated' }}
                    className="h-9 w-9 object-contain"
                  />
                  <Link
                    to={`/pokemon/${favorite.pokemon_id}`}
                    className="flex-1 text-sm font-semibold capitalize text-ink hover:text-accent"
                  >
                    {favorite.pokemon_name.replace(/-/g, ' ')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(favorite)}
                    aria-label={`Remove ${favorite.pokemon_name} from favorites`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:text-accent"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function Profile() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  )
}
