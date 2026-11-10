// Pure module (geen Nuxt auto-imports) zodat het ook vanuit scripts/admin.ts te gebruiken is.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, (error, key) =>
      error ? reject(error) : resolve(key),
    )
  })
}

/** Geeft een string terug in het formaat `scrypt$<salt>$<hash>` (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt)
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, hash] = stored.split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const key = await scryptAsync(password, Buffer.from(salt, 'base64url'))
  return key.length === expected.length && timingSafeEqual(key, expected)
}

export const MIN_PASSWORD_LENGTH = 10
