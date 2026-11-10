import { hashPassword, MIN_PASSWORD_LENGTH } from '../../../lib/password'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { email, name, password } = await readBody(event)
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw createError({ statusCode: 400, message: 'Vul een geldig e-mailadres in.' })
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Het wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn.`,
    })
  }
  const db = useDb()
  if (db.prepare('SELECT 1 FROM admins WHERE email = ?').get(email.trim())) {
    throw createError({ statusCode: 409, message: 'Er is al een beheerder met dit e-mailadres.' })
  }
  db.prepare('INSERT INTO admins (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    email.trim(),
    typeof name === 'string' ? name.trim().slice(0, 60) : '',
    await hashPassword(password),
    new Date().toISOString(),
  )
  setResponseStatus(event, 201)
  return { ok: true }
})
