import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CircleDot, ShieldCheck, Trophy, UserRound } from 'lucide-react'
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
              `inline-flex h-10 items-center gap-2 rounded-lg px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 ease-mechanical active:translate-y-[2px] active:shadow-pressed ${
                isActive
                  ? 'bg-accent text-accent-foreground shadow-accent-card'
                  : 'bg-background text-ink-muted shadow-card hover:text-accent'
              }`
            }
          >
            <Trophy size={14} strokeWidth={2} />
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
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full transition hover:text-accent"
                title="Profile"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background shadow-recessed">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Your avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={16} strokeWidth={2} className="text-ink-muted" />
                  )}
                </span>
                <span
                  className="hidden truncate font-mono text-xs text-ink-muted md:block md:max-w-[160px]"
                  title={profile?.email}
                >
                  {profile?.username ?? profile?.email}
                </span>
              </Link>
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
