import { supabase } from './supabaseClient'

export type BugReportType = 'bug' | 'missing_card' | 'wrong_image'

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

interface SubmitBugReportInput {
  reportType: BugReportType
  email: string
  subject: string
  message: string
  screenshot: File | null
  honeypot: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(new Error('Could not read the screenshot file.'))
    reader.readAsDataURL(file)
  })
}

export async function submitBugReport(input: SubmitBugReportInput): Promise<void> {
  if (input.screenshot && input.screenshot.size > MAX_SCREENSHOT_BYTES) {
    throw new Error('Screenshot must be smaller than 5MB.')
  }

  const screenshot = input.screenshot
    ? { data: await fileToBase64(input.screenshot), mimeType: input.screenshot.type }
    : null

  const { data, error } = await supabase.functions.invoke('submit-bug-report', {
    body: {
      reportType: input.reportType,
      email: input.email.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      screenshot,
      honeypot: input.honeypot,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    },
  })

  if (error) {
    throw new Error('Could not send your report. Please try again in a moment.')
  }
  if (!data?.ok) {
    throw new Error(data?.error || 'Could not send your report. Please try again in a moment.')
  }
}
