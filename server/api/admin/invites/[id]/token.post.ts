// Maakt een nieuwe link voor een uitnodiging (bijv. als die verlopen is of de link kwijt is).
// De oude link werkt daarna niet meer en de nieuwe is weer een week geldig.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { token, hash } = createToken()
  const expiresAt = inviteExpiry()
  const { changes } = useDb()
    .prepare('UPDATE admin_invites SET token_hash = ?, expires_at = ? WHERE id = ?')
    .run(hash, expiresAt, Number(getRouterParam(event, 'id')))
  if (!changes) throw createError({ statusCode: 404, statusMessage: 'Niet gevonden' })
  return { token, expiresAt }
})
