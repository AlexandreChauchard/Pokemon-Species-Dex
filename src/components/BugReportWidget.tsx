import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle2,
  ImageOff,
  Loader2,
  Paperclip,
  SearchX,
  Send,
  X,
} from 'lucide-react'
import { MAX_SCREENSHOT_BYTES, submitBugReport, type BugReportType } from '../lib/bugReports'

type Stage = 'closed' | 'menu' | 'form' | 'success'

const REPORT_OPTIONS: { type: BugReportType; label: string; icon: typeof Bug }[] = [
  { type: 'bug', label: 'Report a bug', icon: Bug },
  { type: 'missing_card', label: 'Missing card', icon: SearchX },
  { type: 'wrong_image', label: 'Wrong image', icon: ImageOff },
]

const FORM_TITLES: Record<BugReportType, string> = {
  bug: 'Report a bug',
  missing_card: 'Report a missing card',
  wrong_image: 'Report a wrong image',
}

export default function BugReportWidget() {
  const [stage, setStage] = useState<Stage>('closed')
  const [reportType, setReportType] = useState<BugReportType | null>(null)
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current)
    }
  }, [])

  const reset = () => {
    setReportType(null)
    setEmail('')
    setSubject('')
    setMessage('')
    setScreenshot(null)
    setScreenshotPreview(null)
    setHoneypot('')
    setError(null)
    setSubmitting(false)
  }

  const close = () => {
    setStage('closed')
    reset()
  }

  const openMenu = () => setStage((s) => (s === 'closed' ? 'menu' : 'closed'))

  const chooseType = (type: BugReportType) => {
    setReportType(type)
    setError(null)
    setStage('form')
  }

  const handleScreenshotChange = (file: File | null) => {
    setError(null)
    if (file && file.size > MAX_SCREENSHOT_BYTES) {
      setError('Screenshot must be smaller than 5MB.')
      return
    }
    setScreenshot(file)
    setScreenshotPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reportType) return
    setError(null)
    setSubmitting(true)
    try {
      await submitBugReport({ reportType, email, subject, message, screenshot, honeypot })
      setStage('success')
      successTimer.current = setTimeout(close, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {stage === 'menu' && (
          <div className="flex w-56 flex-col gap-1 rounded-xl bg-background p-2 shadow-floating">
            {REPORT_OPTIONS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => chooseType(type)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-left font-mono text-xs font-bold uppercase tracking-wider text-ink-muted transition hover:bg-muted hover:text-accent"
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={openMenu}
          aria-label={stage === 'closed' ? 'Report an issue' : 'Close report menu'}
          aria-expanded={stage === 'menu'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-ink-muted shadow-floating transition-all duration-150 ease-mechanical hover:text-accent active:translate-y-[2px] active:shadow-pressed"
        >
          {stage === 'menu' ? <X size={22} /> : <Bug size={22} />}
        </button>
      </div>

      {(stage === 'form' || stage === 'success') && reportType && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-6 py-10 backdrop-blur-sm sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background p-8 shadow-floating"
            onClick={(e) => e.stopPropagation()}
          >
            {stage === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <CheckCircle2 size={40} className="text-accent" strokeWidth={2} />
                <h2 className="text-lg font-bold text-ink">Thanks for the report!</h2>
                <p className="font-mono text-xs text-ink-muted">
                  It's on its way. We'll follow up by email if needed.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStage('menu')}
                      aria-label="Back"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:text-accent"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <h2 className="text-lg font-bold text-ink">{FORM_TITLES[reportType]}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:text-accent"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Honeypot: hidden from real users, off-screen rather than
                      display:none so simple bots that only check computed
                      visibility still fill it in. */}
                  <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label htmlFor="website">Leave this field empty</label>
                    <input
                      id="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="bugReportEmail"
                      className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted"
                    >
                      Email
                    </label>
                    <input
                      id="bugReportEmail"
                      type="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-14 w-full rounded-md border-none bg-background px-5 font-mono text-base text-ink shadow-recessed outline-none placeholder:text-ink-muted/50 focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_#ff4757]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="bugReportSubject"
                      className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted"
                    >
                      Subject
                    </label>
                    <input
                      id="bugReportSubject"
                      type="text"
                      required
                      maxLength={150}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="h-14 w-full rounded-md border-none bg-background px-5 font-mono text-base text-ink shadow-recessed outline-none placeholder:text-ink-muted/50 focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_#ff4757]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="bugReportMessage"
                      className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted"
                    >
                      Message
                    </label>
                    <textarea
                      id="bugReportMessage"
                      required
                      maxLength={5000}
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full resize-none rounded-md border-none bg-background p-5 font-mono text-sm text-ink shadow-recessed outline-none placeholder:text-ink-muted/50 focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_#ff4757]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Screenshot (optional)
                    </label>
                    {screenshotPreview ? (
                      <div className="relative">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="max-h-40 w-full rounded-md object-contain shadow-recessed"
                        />
                        <button
                          type="button"
                          onClick={() => handleScreenshotChange(null)}
                          aria-label="Remove screenshot"
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background text-ink-muted shadow-card hover:text-accent"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="bugReportScreenshot"
                        className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-md bg-background font-mono text-xs uppercase tracking-wider text-ink-muted shadow-recessed transition hover:brightness-95"
                      >
                        <Paperclip size={14} strokeWidth={2} />
                        Attach an image
                      </label>
                    )}
                    <input
                      id="bugReportScreenshot"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => handleScreenshotChange(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3 font-mono text-xs text-accent shadow-recessed">
                      <AlertTriangle size={16} strokeWidth={2} />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 font-mono text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-accent-card transition-all duration-150 ease-mechanical hover:brightness-110 active:translate-y-[2px] active:shadow-pressed disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Send size={14} strokeWidth={2.5} />
                    )}
                    {submitting ? 'Sending...' : 'Send report'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
