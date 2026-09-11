import LedIndicator from './LedIndicator'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border-dark/40 px-6 py-8 lg:px-12">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
          Poké Species Dex, unofficial fan project
        </p>
        <LedIndicator color="green" pulse={false} label="Data via PokéAPI" />
      </div>
    </footer>
  )
}
