import { Link } from 'react-router-dom'
import { PackageSearch, PlusCircle, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../auth/AuthContext'

export default function Admin() {
  const { profile } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-2xl bg-background p-10 text-center shadow-floating">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-recessed">
            <ShieldCheck className="text-accent" size={26} strokeWidth={1.5} />
          </span>
          <h1 className="text-emboss mt-4 text-2xl font-extrabold tracking-tight text-ink">
            Admin control room
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Signed in as{' '}
            <span className="font-semibold text-ink">{profile?.username ?? profile?.email}</span>.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/admin/cards/new"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-accent-card transition-all duration-150 ease-mechanical hover:brightness-110 active:translate-y-[2px] active:shadow-pressed"
            >
              <PlusCircle size={16} strokeWidth={2} />
              Add a card
            </Link>
            <Link
              to="/admin/cards/bulk"
              className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink-muted shadow-card transition-all duration-150 ease-mechanical hover:text-accent active:translate-y-[2px] active:shadow-pressed"
            >
              <PackageSearch size={16} strokeWidth={2} />
              Bulk add cards
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
