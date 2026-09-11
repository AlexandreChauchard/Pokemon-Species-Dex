// Sends transactional email via Gmail SMTP (an App Password on GMAIL_USER's
// account), instead of Resend. Resend's sandbox mode (no verified domain)
// only allows delivery to the account's own signup address, which broke
// every notification whose recipient isn't that one address (confirmed
// live: bug reports always went to that same address so they "worked" by
// coincidence, but favorite notifications go to arbitrary users and always
// 403'd). Gmail SMTP has no such restriction since you're sending as
// yourself, not claiming a domain you don't own.
import nodemailer from 'npm:nodemailer@6'

interface SendEmailInput {
  to: string
  subject: string
  text: string
  replyTo?: string
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter
  const user = Deno.env.get('GMAIL_USER')
  const pass = Deno.env.get('GMAIL_APP_PASSWORD')
  if (!user || !pass) return null

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
  return transporter
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const user = Deno.env.get('GMAIL_USER')
  const t = getTransporter()
  if (!t || !user) {
    console.error('GMAIL_USER/GMAIL_APP_PASSWORD not configured; skipping email.')
    return false
  }

  try {
    await t.sendMail({
      from: `Poke Species Dex <${user}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    })
    return true
  } catch (err) {
    console.error('Gmail SMTP send failed:', err instanceof Error ? err.message : err)
    return false
  }
}
