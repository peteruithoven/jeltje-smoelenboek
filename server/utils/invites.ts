// Uitnodigingen voor nieuwe beheerders. Net als bij bewerklinks staat alleen de hash van het
// token in de database; de link zelf wordt alleen bij het aanmaken getoond.

/** Een uitnodigingslink is een week geldig. */
export const INVITE_VALID_MS = 7 * 24 * 60 * 60 * 1000

export interface InviteRow {
  id: number
  name: string
  created_by: number | null
  created_by_name: string | null
  created_at: string
  expires_at: string
}

export interface Invite {
  id: number
  name: string
  createdBy: string | null
  createdAt: string
  expiresAt: string
  expired: boolean
}

export const INVITE_SELECT = `SELECT i.id, i.name, i.created_by, i.created_at, i.expires_at,
  COALESCE(NULLIF(a.name, ''), a.email) AS created_by_name
  FROM admin_invites i LEFT JOIN admins a ON a.id = i.created_by`

export function toInvite(row: InviteRow): Invite {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by_name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    expired: isExpired(row),
  }
}

export function inviteExpiry() {
  return new Date(Date.now() + INVITE_VALID_MS).toISOString()
}

function isExpired(row: Pick<InviteRow, 'expires_at'>) {
  return new Date(row.expires_at).getTime() <= Date.now()
}

/** Zoekt een geldige (niet verlopen) uitnodiging bij een token uit de link. */
export function findInviteByToken(token: string | undefined): InviteRow {
  const invalid = createError({
    statusCode: 404,
    statusMessage: 'Niet gevonden',
    message: 'Deze uitnodiging is niet (meer) geldig. Vraag een beheerder om een nieuwe link.',
  })
  if (!token || token.length > 100) throw invalid
  const row = useDb().prepare(`${INVITE_SELECT} WHERE i.token_hash = ?`).get(hashToken(token)) as
    | InviteRow
    | undefined
  if (!row || isExpired(row)) throw invalid
  return row
}
