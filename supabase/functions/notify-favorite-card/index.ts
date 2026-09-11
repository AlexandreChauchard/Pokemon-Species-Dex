// Notifies everyone who favorited a species that it was just marked
// completed. Called once, immediately, right when the admin flips the
// completion switch (card-add notifications are handled separately via a
// debounced queue, see notification_batching.sql and
// flush-card-notifications, so several cards added in quick succession
// become one email instead of one per card).
// verify_jwt is ON for this function (unlike submit-bug-report), so only a
// genuinely logged-in user can even reach this code; we additionally check
// that caller is an admin before sending anything, so a regular logged-in
// user can't spam other users' inboxes with fake "completed" emails.
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_PROFILE_NAME_LENGTH = 100

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getCallerId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length)
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)
  }

  // Supabase's gateway already verified this JWT's signature before
  // invoking us (verify_jwt is on for this function), so the sub claim is
  // trustworthy without us re-verifying it.
  const callerId = getCallerId(req.headers.get('authorization'))
  if (!callerId) {
    return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400)
  }

  const pokemonId = Number(payload.pokemonId)
  const pokemonName =
    typeof payload.pokemonName === 'string'
      ? payload.pokemonName.trim().slice(0, MAX_PROFILE_NAME_LENGTH)
      : ''

  if (!Number.isInteger(pokemonId) || pokemonId <= 0 || !pokemonName) {
    return jsonResponse({ ok: false, error: 'Invalid pokemonId or pokemonName.' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile, error: callerError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .single()

  if (callerError || callerProfile?.role !== 'admin') {
    return jsonResponse({ ok: false, error: 'Only admins can trigger notifications.' }, 403)
  }

  const { data: favorites, error: favoritesError } = await admin
    .from('favorites')
    .select('user_id')
    .eq('pokemon_id', pokemonId)

  if (favoritesError) {
    console.error('Failed to load favorites:', favoritesError.message)
    return jsonResponse({ ok: false, error: 'Could not load favorites.' }, 500)
  }

  if (!favorites || favorites.length === 0) {
    return jsonResponse({ ok: true, notified: 0 })
  }

  const userIds = favorites.map((f) => f.user_id)
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('email')
    .in('id', userIds)

  if (profilesError) {
    console.error('Failed to load profiles:', profilesError.message)
    return jsonResponse({ ok: false, error: 'Could not load recipient emails.' }, 500)
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://pokemon-card-collector-mu.vercel.app'

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured; skipping notification emails.')
    return jsonResponse({ ok: true, notified: 0 })
  }

  const subject = `${pokemonName} is now completed!`
  const text = [
    `${pokemonName} was just marked completed on Poke Species Dex.`,
    '',
    `Check it out: ${siteUrl}/pokemon/${pokemonId}`,
    '',
    "You're getting this because you favorited this Pokemon. Remove it from your favorites on your profile page to stop these emails.",
  ].join('\n')

  let notified = 0
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
      if (res.ok) {
        notified++
      } else {
        console.error('Resend send failed for a favorite notification:', res.status, await res.text())
      }
    } catch (err) {
      console.error('Resend request threw:', err instanceof Error ? err.message : err)
    }
  }

  return jsonResponse({ ok: true, notified })
})
