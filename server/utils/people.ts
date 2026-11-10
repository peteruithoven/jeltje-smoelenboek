import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

export interface PersonRow {
  id: string
  name: string
  roles: string
  role_other: string
  repairs: string
  about: string
  photo_crop: string | null
  photo_updated_at: string | null
  has_photo: number
  visible: number
  created_at: string
  updated_at: string
}

/** Kolommen zonder de (grote) foto-blobs */
export const PERSON_COLUMNS = `id, name, roles, role_other, repairs, about, photo_crop, photo_updated_at,
  photo IS NOT NULL AS has_photo, visible, created_at, updated_at`

export function toPersonData(row: PersonRow): PersonData {
  return {
    id: row.id,
    name: row.name,
    roles: JSON.parse(row.roles),
    roleOther: row.role_other,
    repairs: row.repairs,
    about: row.about,
    hasPhoto: Boolean(row.has_photo),
    photoVersion: row.photo_updated_at,
    photoCrop: row.photo_crop ? JSON.parse(row.photo_crop) : null,
    visible: Boolean(row.visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// Bewerk-tokens: alleen de hash staat in de database.

export function createToken() {
  const token = randomBytes(24).toString('base64url')
  return { token, hash: hashToken(token) }
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function newPersonId() {
  return randomUUID()
}

export function findPersonByToken(token: string | undefined): PersonRow {
  if (!token || token.length > 100) throw notFound()
  const row = useDb()
    .prepare(`SELECT ${PERSON_COLUMNS} FROM people WHERE token_hash = ?`)
    .get(hashToken(token)) as PersonRow | undefined
  if (!row) throw notFound()
  return row
}

export function findPersonById(id: string | undefined): PersonRow {
  const row = useDb()
    .prepare(`SELECT ${PERSON_COLUMNS} FROM people WHERE id = ?`)
    .get(id ?? '') as PersonRow | undefined
  if (!row) throw notFound()
  return row
}

function notFound() {
  return createError({
    statusCode: 404,
    statusMessage: 'Niet gevonden',
    message: 'Deze link is niet (meer) geldig.',
  })
}

// ---------------------------------------------------------------------------
// Validatie van formulierdata

export interface PhotoInput {
  photo: Buffer
  original: Buffer
  crop: Crop
}

export interface PersonInput extends PersonFields {
  consent: true
  photo: PhotoInput | null
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const MAX_ORIGINAL_BYTES = 4 * 1024 * 1024

function badRequest(message: string) {
  return createError({ statusCode: 400, statusMessage: 'Ongeldige invoer', message })
}

function text(value: unknown, field: string, max: number, required = false): string {
  if (value === undefined || value === null) value = ''
  if (typeof value !== 'string') throw badRequest(`Ongeldige waarde voor ${field}.`)
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (required && !cleaned) throw badRequest(`Vul je ${field} in.`)
  if (cleaned.length > max) throw badRequest(`${field} mag maximaal ${max} tekens zijn.`)
  return cleaned
}

function jpeg(value: unknown, field: string, max: number): Buffer {
  if (typeof value !== 'string') throw badRequest(`Ongeldige ${field}.`)
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(value)
  if (!match) throw badRequest(`De ${field} moet een JPEG-afbeelding zijn.`)
  const buffer = Buffer.from(match[1]!, 'base64')
  if (buffer.length > max) throw badRequest(`De ${field} is te groot.`)
  // JPEG magic bytes
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
    throw badRequest(`De ${field} moet een JPEG-afbeelding zijn.`)
  }
  return buffer
}

function crop(value: unknown): Crop {
  const crop = value as Partial<Crop> | undefined
  const keys = ['left', 'top', 'width', 'height'] as const
  if (!crop || !keys.every((key) => Number.isFinite(crop[key]))) {
    throw badRequest('Ongeldige uitsnede van de foto.')
  }
  return Object.fromEntries(keys.map((key) => [key, Math.round(crop[key]!)])) as unknown as Crop
}

export async function readPersonInput(
  event: H3Event,
  { photoRequired }: { photoRequired: boolean },
): Promise<PersonInput> {
  const body = await readBody(event)
  if (!body || typeof body !== 'object') throw badRequest('Ongeldige invoer.')

  // Honeypot tegen spambots: dit veld is onzichtbaar voor mensen
  if (body.website) throw badRequest('Er ging iets mis.')

  const name = text(body.name, 'naam', LIMITS.name, true)

  if (!Array.isArray(body.roles) || !body.roles.every(isRole) || body.roles.length === 0) {
    throw badRequest('Kies minimaal één rol.')
  }
  const roles = ROLES.map((role) => role.value).filter((role) => body.roles.includes(role))
  const roleOther = roles.includes('anders')
    ? text(body.roleOther, 'andere rol', LIMITS.roleOther, true)
    : ''
  const repairs = roles.includes('reparateur')
    ? text(body.repairs, 'wat je graag repareert', LIMITS.repairs)
    : ''
  const about = text(body.about, 'zin over jezelf', LIMITS.about)

  if (body.consent !== true) {
    throw badRequest('Zonder toestemming kunnen we je niet opnemen in het smoelenboek.')
  }

  let photo: PhotoInput | null = null
  if (body.photo) {
    photo = {
      photo: jpeg(body.photo.photo, 'foto', MAX_PHOTO_BYTES),
      original: jpeg(body.photo.original, 'originele foto', MAX_ORIGINAL_BYTES),
      crop: crop(body.photo.crop),
    }
  } else if (photoRequired) {
    throw badRequest('Voeg een foto toe.')
  }

  return { name, roles, roleOther, repairs, about, consent: true, photo }
}

export function sendJpeg(event: H3Event, data: Uint8Array | null | undefined) {
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Geen foto' })
  setResponseHeaders(event, {
    'Content-Type': 'image/jpeg',
    // Privé: niet in gedeelde caches. URL bevat een versie, dus de browser mag 'm bewaren.
    'Cache-Control': 'private, max-age=31536000, immutable',
  })
  return Buffer.from(data)
}
