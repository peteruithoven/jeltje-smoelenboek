// Gedeeld tussen app en server (auto-import via Nuxt `shared/utils`).

export const ROLES = [
  { value: 'reparateur', label: 'Reparateur', color: 'red' },
  { value: 'gastvrouw', label: 'Gastvrouw', color: 'blue' },
  { value: 'gastheer', label: 'Gastheer', color: 'blue' },
  { value: 'anders', label: 'Iets anders', color: 'brown' },
] as const

export type Role = (typeof ROLES)[number]['value']
export type RoleColor = (typeof ROLES)[number]['color']

export const LIMITS = {
  name: 60,
  roleOther: 40,
  repairs: 100,
  about: 150,
} as const

export interface PersonFields {
  name: string
  roles: Role[]
  roleOther: string
  repairs: string
  about: string
}

export interface Crop {
  left: number
  top: number
  width: number
  height: number
}

/** Wat de server terugstuurt bij het ophalen van een persoon */
export interface PersonData extends PersonFields {
  id: string
  hasPhoto: boolean
  photoVersion: string | null
  photoCrop: Crop | null
  visible: boolean
  createdAt: string
  updatedAt: string
}

export function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role.value === value)
}

/** Tekst zoals die in het smoelenboek komt, bijv. "Reparateur & gastvrouw" */
export function roleLabel(person: Pick<PersonFields, 'roles' | 'roleOther'>): string {
  const labels = ROLES.filter((role) => person.roles.includes(role.value)).map((role) =>
    role.value === 'anders' ? person.roleOther.trim() : role.label,
  )
  const parts = labels
    .filter(Boolean)
    .map((label, index) => (index === 0 ? label : label.charAt(0).toLowerCase() + label.slice(1)))
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} & ${parts.at(-1)}`
}

export function roleColor(roles: Role[]): RoleColor {
  return ROLES.find((role) => roles.includes(role.value))?.color ?? 'red'
}

export const COLORS: Record<RoleColor | 'green' | 'ink', string> = {
  red: '#fc4237',
  blue: '#7aaed5',
  brown: '#663a2a',
  green: '#5b9669',
  ink: '#1f1f1d',
}

/** Kleine, deterministische "kanteling" per naam zodat labels speels maar stabiel staan. */
export function labelTilt(name: string): number {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const tilts = [-2.5, -1.5, 1.5, 2.5]
  return tilts[Math.abs(hash) % tilts.length]!
}
