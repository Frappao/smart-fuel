import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '../../../../lib/supabase/server'

// Elimina l'account di chi fa la richiesta. L'utente viene identificato solo
// dal proprio token di accesso Supabase (header Authorization), mai da un id
// passato nel corpo. Le auto salvate vengono cancellate a cascata
// (user_vehicles.user_id → auth.users on delete cascade).
export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const accessToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : ''

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Accedi di nuovo per eliminare l’account.' },
      { status: 401 },
    )
  }

  let supabase
  try {
    supabase = createSupabaseServerClient()
  } catch {
    return NextResponse.json(
      { error: 'Servizio account non disponibile. Riprova più tardi.' },
      { status: 503 },
    )
  }

  const { data, error: userError } = await supabase.auth.getUser(accessToken)
  const userId = data?.user?.id

  if (userError || !userId) {
    return NextResponse.json(
      { error: 'Sessione scaduta: accedi di nuovo per eliminare l’account.' },
      { status: 401 },
    )
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

  if (deleteError) {
    console.error('[account-delete] Deletion failed:', deleteError.message)
    return NextResponse.json(
      { error: 'Non è stato possibile eliminare l’account. Riprova tra poco.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
