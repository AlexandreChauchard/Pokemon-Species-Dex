import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount?: number
}

export default function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink-muted"
          size={20}
          strokeWidth={1.5}
        />
        <input
          type="text"
          inputMode="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name or dex number…"
          className="h-14 w-full rounded-md border-none bg-background pl-14 pr-14 font-mono text-base text-ink shadow-recessed outline-none placeholder:text-ink-muted/50 focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_#ff4757]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:text-accent active:translate-y-[calc(-50%+1px)]"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {value && typeof resultCount === 'number' && (
        <p className="mt-2 text-center font-mono text-xs uppercase tracking-wider text-ink-muted">
          {resultCount} {resultCount === 1 ? 'match' : 'matches'} found
        </p>
      )}
    </div>
  )
}
