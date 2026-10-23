import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Formato richiesta non valido.' },
      { status: 400 },
    )
  }

  const rawEmail =
    typeof body === 'object' &&
    body !== null &&
    'email' in body &&
    typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email.trim().toLowerCase()
      : ''

  const rawPlatform =
    typeof body === 'object' &&
    body !== null &&
    'platform' in body &&
    typeof (body as { platform?: unknown }).platform === 'string'
      ? (body as { platform: string }).platform
      : ''

  if (!rawEmail || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
    return NextResponse.json(
      { error: 'Inserisci un indirizzo email valido.' },
      { status: 400 },
    )
  }

  if (rawPlatform !== 'android' && rawPlatform !== 'ios') {
    return NextResponse.json(
      { error: 'Piattaforma non valida.' },
      { status: 400 },
    )
  }

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.from('app_waitlist').insert({
      email: rawEmail,
      platform: rawPlatform,
    })

    // 23505 = unique_violation (email already registered for this platform)
    if (error && error.code !== '23505') {
      console.warn('[app-waitlist] Database insert notice:', error.message)
    }
  } catch {
    // Graceful fallback if Supabase env or table is not yet deployed
  }

  return NextResponse.json({ ok: true })
}
