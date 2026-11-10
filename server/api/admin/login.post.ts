import { verifyPassword } from '../../lib/password'

export default defineEventHandler(async (event) => {
  rateLimit(event, 'login', 10, 15 * 60 * 1000)
  const { email, password } = await readBody(event)
  const invalid = createError({
    statusCode: 401,
    statusMessage: 'Onjuiste inloggegevens',
    message: 'E-mailadres of wachtwoord klopt niet.',
  })
  if (typeof email !== 'string' || typeof password !== 'string') throw invalid

  const admin = useDb().prepare('SELECT * FROM admins WHERE email = ?').get(email.trim()) as
    | AdminRow
    | undefined
  if (!admin || !(await verifyPassword(password, admin.password_hash))) throw invalid

  await setUserSession(event, {
    user: { id: admin.id, email: admin.email, name: admin.name },
    loggedInAt: new Date().toISOString(),
  })
  return { ok: true }
})
