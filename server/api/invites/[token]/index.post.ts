import { hashPassword, MIN_PASSWORD_LENGTH } from '../../../lib/password'

// Openbaar: uitnodiging accepteren. Maakt de beheerder aan, verwijdert de uitnodiging
// (een link werkt dus maar één keer) en logt de nieuwe beheerder meteen in.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'invite', 30, 15 * 60 * 1000)
  const token = getRouterParam(event, 'token')
  findInviteByToken(token)

  const { name, email, password } = (await readBody(event)) ?? {}
  const cleanName = typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, 60) : ''
  if (!cleanName) throw createError({ statusCode: 400, message: 'Vul je naam in.' })
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw createError({ statusCode: 400, message: 'Vul een geldig e-mailadres in.' })
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Het wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn.`,
    })
  }
  const passwordHash = await hashPassword(password)

  // Na het (async) hashen opnieuw controleren, en alles in één transactie, zodat dezelfde
  // link niet twee keer gebruikt kan worden.
  const db = useDb()
  let adminId: number
  db.exec('BEGIN IMMEDIATE')
  try {
    const invite = findInviteByToken(token)
    if (db.prepare('SELECT 1 FROM admins WHERE email = ?').get(email.trim())) {
      throw createError({
        statusCode: 409,
        message: 'Er is al een beheerder met dit e-mailadres. Probeer in te loggen.',
      })
    }
    const result = db
      .prepare('INSERT INTO admins (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(email.trim(), cleanName, passwordHash, new Date().toISOString())
    adminId = Number(result.lastInsertRowid)
    db.prepare('DELETE FROM admin_invites WHERE id = ?').run(invite.id)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  await setUserSession(event, {
    user: { id: adminId, email: email.trim(), name: cleanName },
    loggedInAt: new Date().toISOString(),
  })
  setResponseStatus(event, 201)
  return { ok: true }
})
