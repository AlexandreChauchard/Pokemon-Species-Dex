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

export default function Terms() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-6 py-10 lg:px-12 lg:py-14">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div>
            <h1 className="text-emboss text-3xl font-extrabold tracking-tight text-ink">
              Terms of Service
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-muted">
              Last updated {LAST_UPDATED}
            </p>
          </div>

          <div className="flex flex-col gap-8 rounded-2xl bg-background p-8 shadow-floating">
            <Section title="Acceptance">
              <p>
                By using Poke Species Dex, you agree to these terms. If you don't agree, please
                don't use the site.
              </p>
            </Section>

            <Section title="What this site is">
              <p>
                Poke Species Dex is an independent, unofficial fan project for browsing Pokemon
                species and tracking Pokemon Trading Card Game collections. Pokemon and all
                related names, images, and trademarks belong to Nintendo, Game Freak, Creatures
                Inc., and The Pokemon Company; this site isn't affiliated with, endorsed by, or
                sponsored by any of them. Species data and sprites come from PokeAPI, and card
                data comes from TCGdex, both public, third-party sources whose accuracy we don't
                control or guarantee.
              </p>
            </Section>

            <Section title="Accounts">
              <p>
                You need an account to add cards to the catalog, favorite Pokemon, or set a
                profile picture. You're responsible for keeping your password secure and for
                what happens under your account. Give us an accurate email address so we can
                reach you if needed.
              </p>
            </Section>

            <Section title="Acceptable use">
              <p>Please don't:</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>Submit bug/feedback reports that are abusive, spam, or contain illegal content.</li>
                <li>Try to disrupt, overload, or gain unauthorized access to the site.</li>
                <li>Upload a profile picture or screenshot you don't have the right to share.</li>
                <li>Use an account you're not authorized to use.</li>
              </ul>
              <p>
                We can remove content or suspend accounts that violate this, at our discretion.
              </p>
            </Section>

            <Section title="Your content">
              <p>
                Anything you submit (bug reports, screenshots, your username, your profile
                picture) stays yours, but by submitting it you allow us to store and display it
                as needed to run the site (for example, showing your username or avatar back to
                you, or including a screenshot in a bug-report email).
              </p>
            </Section>

            <Section title="No warranty">
              <p>
                This is a hobby project, provided "as is," without warranty of any kind. We don't
                guarantee the site will be available, error-free, or that the card catalog is
                complete or accurate. Card data is added by hand and from third-party sources, so
                mistakes happen, that's exactly what the bug-report tool is for.
              </p>
            </Section>

            <Section title="Limitation of liability">
              <p>
                To the fullest extent permitted by law, we aren't liable for any damages arising
                from your use of, or inability to use, this site.
              </p>
            </Section>

            <Section title="Changes">
              <p>
                We may update these terms or the site's features at any time. Continuing to use
                the site after a change means you accept the update. Meaningful changes to these
                terms will update the date at the top of this page.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about these terms? Email{' '}
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
