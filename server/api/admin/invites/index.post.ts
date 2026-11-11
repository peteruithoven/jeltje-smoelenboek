// Maakt een uitnodigingslink voor een nieuwe beheerder. De naam is optioneel en wordt
// voor-ingevuld op de uitnodigingspagina.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { name } = (await readBody(event)) ?? {}
  const { token, hash } = createToken()
  const expiresAt = inviteExpiry()
  const { lastInsertRowid } = useDb()
    .prepare(
      'INSERT INTO admin_invites (token_hash, name, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(
      hash,
      typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, 60) : '',
      admin.id,
      new Date().toISOString(),
      expiresAt,
    )
  setResponseStatus(event, 201)
  return { id: Number(lastInsertRowid), token, expiresAt }
})
