import SearchBar from './SearchBar'
import LedIndicator from './LedIndicator'
import Switch from './Switch'

interface HeroProps {
  query: string
  onQueryChange: (value: string) => void
  resultCount: number
  totalCount: number
  completedOnly: boolean
  onCompletedOnlyChange: (value: boolean) => void
  completedCount: number
}

export default function Hero({
  query,
  onQueryChange,
  resultCount,
  totalCount,
  completedOnly,
  onCompletedOnlyChange,
  completedCount,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-14 lg:px-12 lg:pt-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 10%, #ffffff 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <LedIndicator color="accent" label={`Tracking ${totalCount.toLocaleString()} species`} />
        </div>

        <h1 className="text-emboss text-5xl font-extrabold tracking-[-0.03em] text-ink lg:text-6xl">
          One Pokémon.
          <br />
          <span className="text-accent">Every card.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-balance text-base leading-relaxed text-ink-muted lg:text-lg">
          Pick your Pokémon and pull up the full checklist, every English print
          first, then every language variant after.
        </p>

        <div className="mt-9">
          <SearchBar value={query} onChange={onQueryChange} resultCount={resultCount} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Completed only
          </span>
          <Switch checked={completedOnly} onChange={onCompletedOnlyChange} />
          {completedCount > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted shadow-recessed">
              {completedCount}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
