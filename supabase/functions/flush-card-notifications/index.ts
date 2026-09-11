// Runs on a schedule (every minute, via pg_cron + pg_net, see project
// memory for the exact cron.schedule call) rather than being invoked by a
// browser, so there's no user JWT to verify. Instead it's gated by a
// shared secret header only the cron job knows, checked before anything
// else runs.
import { createClient } from 'npm:@supabase/supabase-js@2'

const DEBOUNCE_MS = 30 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const cutoff = new Date(Date.now() - DEBOUNCE_MS).toISOString()
  const { data: batches, error } = await admin
    .from('pending_card_notifications')
    .select('pokemon_id, pokemon_name, cards_added')
    .lt('last_added_at', cutoff)

  if (error) {
    console.error('Failed to load pending notifications:', error.message)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }

  if (!batches || batches.length === 0) {
    return new Response(JSON.stringify({ ok: true, flushed: 0 }), { status: 200 })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://pokemon-card-collector-mu.vercel.app'

  for (const batch of batches) {
    const { data: favorites } = await admin
      .from('favorites')
      .select('user_id')
      .eq('pokemon_id', batch.pokemon_id)

    if (favorites && favorites.length > 0 && resendApiKey) {
      const userIds = favorites.map((f) => f.user_id)
      const { data: profiles } = await admin.from('profiles').select('email').in('id', userIds)

      const cardWord = batch.cards_added === 1 ? 'card' : 'cards'
      const subject = `${batch.cards_added} new ${batch.pokemon_name} ${cardWord} added`
      const text = [
        `${batch.cards_added} new ${batch.pokemon_name} ${cardWord} ${batch.cards_added === 1 ? 'was' : 'were'} just added to Poke Species Dex.`,
        '',
        `Check it out: ${siteUrl}/pokemon/${batch.pokemon_id}`,
        '',
        "You're getting this because you favorited this Pokemon. Remove it from your favorites on your profile page to stop these emails.",
      ].join('\n')

      for (const profile of profiles ?? []) {
        if (!profile.email) continue
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Poke Species Dex <onboarding@resend.dev>',
              to: [profile.email],
              subject,
              text,
            }),
          })
          if (!res.ok) {
            console.error('Resend send failed in flush:', res.status, await res.text())
          }
        } catch (err) {
          console.error('Resend request threw in flush:', err instanceof Error ? err.message : err)
        }
      }
    }

    const { error: deleteError } = await admin
      .from('pending_card_notifications')
      .delete()
      .eq('pokemon_id', batch.pokemon_id)
    if (deleteError) {
      console.error('Failed to clear flushed batch:', deleteError.message)
    }
  }

  return new Response(JSON.stringify({ ok: true, flushed: batches.length }), { status: 200 })
})
