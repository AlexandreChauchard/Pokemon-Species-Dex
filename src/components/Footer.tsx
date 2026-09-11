import { Link } from 'react-router-dom'
import LedIndicator from './LedIndicator'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border-dark/40 px-6 py-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            Poké Species Dex, unofficial fan project
          </p>
          <LedIndicator color="green" pulse={false} label="Data via PokéAPI" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border-dark/30 pt-4 sm:justify-start">
          <Link
            to="/privacy"
            className="font-mono text-[11px] uppercase tracking-wider text-ink-muted transition hover:text-accent"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="font-mono text-[11px] uppercase tracking-wider text-ink-muted transition hover:text-accent"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:tiquetou@gmail.com"
            className="font-mono text-[11px] uppercase tracking-wider text-ink-muted transition hover:text-accent"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
