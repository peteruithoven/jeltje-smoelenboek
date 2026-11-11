// Openstaande (en verlopen) uitnodigingen. Uitnodigingen die al meer dan 30 dagen verlopen zijn
// worden opgeruimd.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  db.prepare('DELETE FROM admin_invites WHERE expires_at < ?').run(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  )
  const rows = db
    .prepare(`${INVITE_SELECT} ORDER BY i.created_at DESC`)
    .all() as unknown as InviteRow[]
  return rows.map(toInvite)
})
