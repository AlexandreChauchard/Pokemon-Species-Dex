import type { ReactNode } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const CONTACT_EMAIL = 'tiquetou@gmail.com'
const LAST_UPDATED = 'September 11, 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-accent">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">{children}</div>
    </section>
  )
}

export default function Privacy() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-6 py-10 lg:px-12 lg:py-14">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div>
            <h1 className="text-emboss text-3xl font-extrabold tracking-tight text-ink">
              Privacy Policy
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-muted">
              Last updated {LAST_UPDATED}
            </p>
          </div>

          <div className="flex flex-col gap-8 rounded-2xl bg-background p-8 shadow-floating">
            <Section title="Who runs this site">
              <p>
                Poke Species Dex is an independent, unofficial fan project for tracking Pokemon
                Trading Card Game collections. It isn't affiliated with, endorsed by, or
                sponsored by Nintendo, Game Freak, Creatures Inc., or The Pokemon Company. This
                policy explains what personal data the site collects and what happens to it.
              </p>
            </Section>

            <Section title="What we collect">
              <p>
                <span className="font-semibold text-ink">If you create an account:</span> your
                email address and password (your password is handled entirely by our
                authentication provider, Supabase, and we never see or store it in plain text),
                plus anything you optionally add afterward: a username, a profile picture, and up
                to 10 favorite Pokemon.
              </p>
              <p>
                <span className="font-semibold text-ink">If you submit a bug, missing-card,
                or wrong-image report:</span> the email address, subject, and message you type
                in, an optional screenshot you attach, and a couple of technical details we
                collect automatically to help diagnose the issue: the page URL you reported from
                and your browser's user agent string. This works whether or not you have an
                account.
              </p>
              <p>
                <span className="font-semibold text-ink">Automatically, for anyone browsing the
                site:</span> aggregate, anonymized page-visit analytics via Vercel Analytics,
                which doesn't use cookies and doesn't identify you individually.
              </p>
            </Section>

            <Section title="Why we collect it">
              <ul className="ml-4 list-disc space-y-1.5">
                <li>To let you sign in and manage your own account.</li>
                <li>
                  To email you when a Pokemon you favorited is completed, or gets new cards
                  added, if you've chosen to favorite it.
                </li>
                <li>To respond to and fix the issue you reported.</li>
                <li>To understand overall site usage and improve it.</li>
              </ul>
              <p>We don't sell your data, and we don't use it for advertising.</p>
            </Section>

            <Section title="Who we share it with">
              <p>The following third parties process data on our behalf to run the site:</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>
                  <span className="font-semibold text-ink">Supabase</span>, for our database,
                  authentication, file storage, and server-side functions. Data is hosted in the
                  EU (Frankfurt).
                </li>
                <li>
                  <span className="font-semibold text-ink">Resend</span>, to deliver the emails
                  described above (bug report confirmations and favorite notifications).
                </li>
                <li>
                  <span className="font-semibold text-ink">Vercel</span>, to host the site and
                  provide anonymized traffic analytics.
                </li>
              </ul>
              <p>
                Pokemon species and card data itself comes from the public PokeAPI and TCGdex
                APIs; no personal data is ever sent to them.
              </p>
            </Section>

            <Section title="Cookies & local storage">
              <p>
                We don't use advertising or cross-site tracking cookies. Your browser locally
                stores your login session (so you stay signed in) and, if you're an admin,
                temporary drafts of forms you're filling out. This data stays on your device and
                isn't sent to any tracker.
              </p>
            </Section>

            <Section title="How long we keep it">
              <p>
                Account data is kept for as long as your account exists. Bug/feedback report
                submissions are kept to help us track and fix issues over time. You can request
                deletion at any point, see below.
              </p>
            </Section>

            <Section title="Your rights">
              <p>
                You can ask to access, correct, or delete the personal data we hold about you at
                any time, favorites and your profile can also be managed directly from your{' '}
                <span className="font-semibold text-ink">Profile</span> page. For anything else,
                including full account deletion, email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>

            <Section title="Children">
              <p>
                This site isn't directed at children, and we don't knowingly collect data from
                anyone under 13. If you believe a child has provided us personal data, contact us
                and we'll remove it.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                If this policy changes in a meaningful way, we'll update the date at the top of
                this page.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about this policy or your data? Email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
