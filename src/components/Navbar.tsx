import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CircleDot, ShieldCheck } from 'lucide-react'
import LedIndicator from './LedIndicator'
import Button from './Button'
import { useAuth } from '../auth/AuthContext'

export default function Navbar() {
  const { user, profile, isAdmin, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-dark/40 bg-background/90 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-floating">
            <CircleDot className="text-accent" size={20} strokeWidth={2} />
          </span>
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
            Poké <span className="text-accent">Species</span> Dex
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/ranking"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition ${
                isActive ? 'text-accent' : 'text-ink-muted hover:text-accent'
              }`
            }
          >
            Ranking
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block">
            <LedIndicator color="green" label="System Operational" />
          </span>

          {!loading && !user && (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="h-10 px-4">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" className="h-10 px-4">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          {!loading && user && (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted shadow-recessed transition hover:text-accent sm:flex"
                >
                  <ShieldCheck size={14} strokeWidth={2} />
                  Admin
                </Link>
              )}
              <span
                className="hidden truncate font-mono text-xs text-ink-muted md:block md:max-w-[160px]"
                title={profile?.email}
              >
                {profile?.username ?? profile?.email}
              </span>
              <Button variant="ghost" className="h-10 px-4" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
