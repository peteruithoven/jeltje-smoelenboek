import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from '../../lib/password'

// Eigen wachtwoord wijzigen
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { currentPassword, newPassword } = await readBody(event)
  const row = useDb().prepare('SELECT password_hash FROM admins WHERE id = ?').get(admin.id) as {
    password_hash: string
  }
  if (
    typeof currentPassword !== 'string' ||
    !(await verifyPassword(currentPassword, row.password_hash))
  ) {
    throw createError({ statusCode: 400, message: 'Je huidige wachtwoord klopt niet.' })
  }
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Het nieuwe wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn.`,
    })
  }
  useDb()
    .prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
    .run(await hashPassword(newPassword), admin.id)
  return { ok: true }
})
