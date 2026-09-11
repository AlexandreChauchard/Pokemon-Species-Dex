// Handles submissions from the site-wide bug/feedback report widget.
// This is the ONLY thing allowed to write to public.bug_reports and the
// bug-reports storage bucket (both have no anon/authenticated RLS policies),
// so every check here is the real security boundary, not a formality.
import { createClient } from 'npm:@supabase/supabase-js@2'

const REPORT_TYPES = new Set(['bug', 'missing_card', 'wrong_image'])
const REPORT_TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  missing_card: 'Missing card',
  wrong_image: 'Wrong image',
}

const MAX_EMAIL_LENGTH = 254
const MAX_SUBJECT_LENGTH = 150
const MAX_MESSAGE_LENGTH = 5000
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
const MAX_REQUEST_BYTES = 8 * 1024 * 1024
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX_PER_WINDOW = 5

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

// Plain-text emails only, so there's no HTML/script injection surface in
// the report content, and strip control characters (incl. CR/LF) from
// anything that could end up influencing headers, out of caution even
// though Resend's JSON API isn't raw SMTP text.
function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\r\n\t\x00-\x1f\x7f]+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

async function hashIp(ip: string): Promise<string> {
  const bytes = new TextEncoder().encode(ip)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function base64ByteLength(base64: string): number {
  const clean = base64.replace(/=+$/, '')
  return Math.floor((clean.length * 3) / 4)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)
  }

  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ ok: false, error: 'Request too large.' }, 413)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400)
  }

  // Honeypot: real users never fill this hidden field. Pretend success so
  // bots don't learn to look elsewhere.
  if (typeof payload.honeypot === 'string' && payload.honeypot.trim() !== '') {
    return jsonResponse({ ok: true })
  }

  const reportType = typeof payload.reportType === 'string' ? payload.reportType : ''
  if (!REPORT_TYPES.has(reportType)) {
    return jsonResponse({ ok: false, error: 'Invalid report type.' }, 400)
  }

  const email = sanitizeText(payload.email, MAX_EMAIL_LENGTH)
  if (!email || !EMAIL_PATTERN.test(email)) {
    return jsonResponse({ ok: false, error: 'Please enter a valid email address.' }, 400)
  }

  const subject = sanitizeText(payload.subject, MAX_SUBJECT_LENGTH)
  if (!subject) {
    return jsonResponse({ ok: false, error: 'Please enter a subject.' }, 400)
  }

  const message = sanitizeText(payload.message, MAX_MESSAGE_LENGTH)
  if (!message) {
    return jsonResponse({ ok: false, error: 'Please enter a message.' }, 400)
  }

  const pageUrl = sanitizeText(payload.pageUrl, 500)
  const userAgent = sanitizeText(payload.userAgent, 300)

  let screenshotBytes: Uint8Array | null = null
  let screenshotExt = ''
  const screenshot = payload.screenshot as { data?: unknown; mimeType?: unknown } | null | undefined
  if (screenshot && typeof screenshot === 'object') {
    const mimeType = typeof screenshot.mimeType === 'string' ? screenshot.mimeType : ''
    const data = typeof screenshot.data === 'string' ? screenshot.data : ''
    const ext = ALLOWED_MIME_TYPES[mimeType]
    if (!ext) {
      return jsonResponse({ ok: false, error: 'Unsupported screenshot format.' }, 400)
    }
    if (!data || base64ByteLength(data) > MAX_SCREENSHOT_BYTES) {
      return jsonResponse({ ok: false, error: 'Screenshot must be smaller than 5MB.' }, 400)
    }
    try {
      screenshotBytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
    } catch {
      return jsonResponse({ ok: false, error: 'Screenshot could not be read.' }, 400)
    }
    if (screenshotBytes.length > MAX_SCREENSHOT_BYTES) {
      return jsonResponse({ ok: false, error: 'Screenshot must be smaller than 5MB.' }, 400)
    }
    screenshotExt = ext
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const ipHash = await hashIp(ip)

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count: recentCount, error: rateLimitError } = await admin
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .or(`email.eq.${email},ip_hash.eq.${ipHash}`)
    .gte('created_at', since)

  if (rateLimitError) {
    console.error('Rate limit check failed:', rateLimitError.message)
  } else if ((recentCount ?? 0) >= RATE_LIMIT_MAX_PER_WINDOW) {
    return jsonResponse(
      { ok: false, error: "You've sent several reports recently. Please try again later." },
      429,
    )
  }

  let screenshotPath: string | null = null
  if (screenshotBytes) {
    const path = `${reportType}/${crypto.randomUUID()}.${screenshotExt}`
    const { error: uploadError } = await admin.storage
      .from('bug-reports')
      .upload(path, screenshotBytes, {
        contentType: Object.entries(ALLOWED_MIME_TYPES).find(([, e]) => e === screenshotExt)?.[0],
        upsert: false,
      })
    if (uploadError) {
      console.error('Screenshot upload failed:', uploadError.message)
    } else {
      screenshotPath = path
    }
  }

  const { error: insertError } = await admin.from('bug_reports').insert({
    report_type: reportType,
    email,
    subject,
    message,
    screenshot_path: screenshotPath,
    page_url: pageUrl || null,
    user_agent: userAgent || null,
    ip_hash: ipHash,
  })

  if (insertError) {
    console.error('Insert failed:', insertError.message)
    return jsonResponse({ ok: false, error: 'Could not save your report. Please try again.' }, 500)
  }

  let screenshotUrl: string | null = null
  if (screenshotPath) {
    const { data: signed } = await admin.storage
      .from('bug-reports')
      .createSignedUrl(screenshotPath, 60 * 60 * 24 * 7)
    screenshotUrl = signed?.signedUrl ?? null
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const toEmail = Deno.env.get('BUG_REPORT_TO_EMAIL')

  if (resendApiKey && toEmail) {
    const lines = [
      `Type: ${REPORT_TYPE_LABELS[reportType]}`,
      `From: ${email}`,
      `Subject: ${subject}`,
      '',
      message,
      '',
      '---',
      pageUrl ? `Page: ${pageUrl}` : null,
      userAgent ? `User agent: ${userAgent}` : null,
      screenshotUrl ? `Screenshot (link expires in 7 days): ${screenshotUrl}` : null,
    ].filter(Boolean)

    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Poke Species Dex <onboarding@resend.dev>',
          to: [toEmail],
          reply_to: email,
          subject: `[Poke Species Dex] ${REPORT_TYPE_LABELS[reportType]}: ${subject}`,
          text: lines.join('\n'),
        }),
      })
      if (!emailRes.ok) {
        console.error('Resend send failed:', emailRes.status, await emailRes.text())
      }
    } catch (err) {
      console.error('Resend request threw:', err instanceof Error ? err.message : err)
    }
  } else {
    console.error('RESEND_API_KEY or BUG_REPORT_TO_EMAIL not configured; report saved but no email sent.')
  }

  return jsonResponse({ ok: true })
})
