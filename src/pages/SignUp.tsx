import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, AlertTriangle, MailCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FormField from '../components/FormField'
import Button from '../components/Button'
import { useAuth } from '../auth/AuthContext'

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const result = await signUp(email, password)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.needsEmailConfirmation) {
      setAwaitingConfirmation(true)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl bg-background p-10 shadow-floating">
          {awaitingConfirmation ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-recessed">
                <MailCheck className="text-accent" size={26} strokeWidth={1.5} />
              </span>
              <h1 className="text-emboss text-2xl font-extrabold tracking-tight text-ink">
                Check your inbox
              </h1>
              <p className="text-sm leading-relaxed text-ink-muted">
                We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>.
                Click it, then come back and sign in.
              </p>
              <Link to="/login" className="mt-2">
                <Button variant="ghost">Go to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col items-center gap-3 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-recessed">
                  <UserPlus className="text-accent" size={26} strokeWidth={1.5} />
                </span>
                <h1 className="text-emboss text-2xl font-extrabold tracking-tight text-ink">
                  Create account
                </h1>
                <p className="text-sm text-ink-muted">Start tracking your collection.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <FormField
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FormField
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FormField
                  id="confirmPassword"
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-accent shadow-recessed">
                    <AlertTriangle size={16} strokeWidth={2} />
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="mt-2 w-full">
                  {submitting ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-accent hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
