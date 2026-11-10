import type { H3Event } from 'h3'

export interface AdminRow {
  id: number
  email: string
  name: string
  password_hash: string
  created_at: string
}

/** Controleert of er een ingelogde beheerder is die (nog) bestaat. */
export async function requireAdmin(event: H3Event) {
  const { user } = await requireUserSession(event)
  const admin = useDb().prepare('SELECT id, email, name FROM admins WHERE id = ?').get(user.id) as
    | Pick<AdminRow, 'id' | 'email' | 'name'>
    | undefined
  if (!admin) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
  }
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return admin
}
