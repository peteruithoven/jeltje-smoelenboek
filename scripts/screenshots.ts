// Maakt de screenshots in de README en slaat ze op als WebP in docs/screenshots/.
//
//   vp run screenshots
//
// Bouwt de app en start die met een lege, tijdelijke
// database vol voorbeelddata, dus je eigen lokale database blijft onaangeroerd. De "foto's" zijn
// getekende avatars: geen echte mensen in een openbare README.
import { execFileSync, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { launch, type Page } from 'puppeteer-core'
import { openDatabase } from '../server/lib/database.ts'
import { hashPassword } from '../server/lib/password.ts'

const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome'
const PORT = Number(process.env.PORT ?? 3123)
const BASE_URL = `http://127.0.0.1:${PORT}`
// Adres dat in de screenshots getoond wordt in plaats van de tijdelijke lokale server
const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://jeltje-smoelenboek.alwaysdata.net'
const ROOT = new URL('../', import.meta.url)
const OUT_DIR = new URL('docs/screenshots/', ROOT)

const ADMIN = {
  email: 'beheer@example.nl',
  name: 'Beheerder',
  password: randomBytes(12).toString('hex'),
}

// Extra beheerders en uitnodigingen voor het scherm Beheerders (verzonnen namen)
const EXTRA_ADMINS = [
  ['joyce@example.nl', 'Joyce van Dam'],
  ['mehmet@example.nl', 'Mehmet Kaya'],
] as const
const INVITES = ['Pieter Smit', 'Fatima El Amrani'] as const

interface Avatar {
  background: string
  skin: string
  hair: string
  shirt: string
  style: 'short' | 'long' | 'bun' | 'bald' | 'curly'
  glasses?: boolean
}

interface DemoPerson {
  name: string
  roles: string[]
  roleOther?: string
  repairs?: string
  about: string
  avatar: Avatar
  hidden?: boolean
}

// Degene die het formulier invult in de screenshots
const FORM_PERSON: DemoPerson = {
  name: 'Sanne Bakker',
  roles: ['reparateur', 'gastvrouw'],
  repairs: 'Naaimachines en kleding',
  about: 'Ik naai al sinds mijn tiende en vind niets leuker dan een lievelingsjas weer heel maken.',
  avatar: {
    background: '#fde2df',
    skin: '#f1c7a5',
    hair: '#6b4226',
    shirt: '#5b9669',
    style: 'long',
  },
}

// Andere vrijwilligers voor het beheer en de PDF
const PEOPLE: DemoPerson[] = [
  {
    name: 'Fatima El Amrani',
    roles: ['reparateur'],
    repairs: 'Kleding, tassen en gordijnen',
    about: 'Naaien heb ik van mijn oma geleerd; elke steek is een herinnering aan haar.',
    avatar: {
      background: '#f3ecdf',
      skin: '#c68863',
      hair: '#1a1a1a',
      shirt: '#7aaed5',
      style: 'bun',
    },
  },
  {
    name: 'Henk de Vries',
    roles: ['reparateur'],
    repairs: "Lampen, radio's en koffiezetapparaten",
    about: 'Gepensioneerd elektricien die nog steeds blij wordt van een brandend lampje.',
    avatar: {
      background: '#dbe9f5',
      skin: '#f6d5bd',
      hair: '#d9d9d9',
      shirt: '#663a2a',
      style: 'bald',
      glasses: true,
    },
  },
  {
    name: 'Els',
    roles: ['gastvrouw'],
    about: 'Ik zorg dat iedereen zich welkom voelt en dat de koffie nooit op is.',
    avatar: {
      background: '#e4efe6',
      skin: '#e0ac85',
      hair: '#c9a26b',
      shirt: '#fc4237',
      style: 'short',
    },
  },
  {
    name: 'Joost',
    roles: ['gastheer', 'anders'],
    roleOther: 'Coördinator',
    about: 'Sinds 2018 betrokken bij Repair Café Jeltje.',
    avatar: {
      background: '#fde2df',
      skin: '#f1c7a5',
      hair: '#a0522d',
      shirt: '#1f1f1d',
      style: 'short',
      glasses: true,
    },
  },
  {
    name: 'Mei Lin',
    roles: ['reparateur'],
    repairs: 'Telefoons, laptops en spelcomputers',
    about: 'Overdag programmeur, op vrijdagavond met de soldeerbout in de weer.',
    avatar: {
      background: '#dbe9f5',
      skin: '#f0cfa8',
      hair: '#1a1a1a',
      shirt: '#5b9669',
      style: 'long',
    },
  },
  {
    name: 'Bart',
    roles: ['reparateur'],
    repairs: 'Fietsen',
    about: 'Geen lekke band is mij te veel.',
    avatar: {
      background: '#f3ecdf',
      skin: '#8d5a3b',
      hair: '#1a1a1a',
      shirt: '#fc4237',
      style: 'curly',
    },
  },
  {
    name: 'Noor',
    roles: ['anders'],
    roleOther: 'Fotograaf',
    about: 'Ik leg de mooiste reparatiemomenten vast.',
    avatar: {
      background: '#e4efe6',
      skin: '#5c3a24',
      hair: '#2b2118',
      shirt: '#7aaed5',
      style: 'curly',
    },
  },
  {
    name: 'Kees',
    roles: ['reparateur'],
    repairs: 'Houten meubels en speelgoed',
    about: 'Gepensioneerd timmerman met gouden handen.',
    avatar: {
      background: '#dbe9f5',
      skin: '#e0ac85',
      hair: '#9a9a9a',
      shirt: '#663a2a',
      style: 'short',
    },
    hidden: true, // laat de "verborgen"-stand zien in het beheer
  },
]

const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 }

function settle(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Tekent een vrolijke avatar als JPEG data-URL (draait in de browser). */
function drawAvatar(avatar: Avatar): string {
  const size = 800
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')!
  const ellipse = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
    start = 0,
    end = Math.PI * 2,
  ) => {
    g.fillStyle = color
    g.beginPath()
    g.ellipse(x, y, rx, ry, 0, start, end)
    g.fill()
  }
  g.fillStyle = avatar.background
  g.fillRect(0, 0, size, size)

  // Lang haar achter het hoofd
  if (avatar.style === 'long') {
    ellipse(400, 400, 215, 240, avatar.hair)
    g.fillRect(185, 400, 430, 250)
  }
  // Schouders en nek
  ellipse(400, 900, 320, 280, avatar.shirt)
  g.fillStyle = avatar.skin
  g.fillRect(350, 520, 100, 110)
  // Hoofd met oren
  ellipse(242, 420, 26, 40, avatar.skin)
  ellipse(558, 420, 26, 40, avatar.skin)
  ellipse(400, 400, 160, 190, avatar.skin)

  // Haar
  if (avatar.style === 'curly') {
    for (const [x, y] of [
      [270, 290],
      [330, 240],
      [400, 225],
      [470, 240],
      [530, 290],
      [250, 350],
      [550, 350],
    ]) {
      ellipse(x!, y!, 62, 58, avatar.hair)
    }
  } else if (avatar.style === 'bald') {
    ellipse(250, 370, 30, 70, avatar.hair)
    ellipse(550, 370, 30, 70, avatar.hair)
  } else {
    ellipse(400, 330, 172, 125, avatar.hair, Math.PI, Math.PI * 2)
    if (avatar.style === 'bun') ellipse(400, 175, 70, 62, avatar.hair)
    if (avatar.style === 'short' || avatar.style === 'bun')
      ellipse(400, 330, 172, 40, avatar.hair, 0, Math.PI)
  }

  // Gezicht
  g.fillStyle = '#1f1f1d'
  g.strokeStyle = '#1f1f1d'
  g.lineCap = 'round'
  for (const x of [340, 460]) {
    g.beginPath()
    g.arc(x, 415, 15, 0, Math.PI * 2)
    g.fill()
  }
  g.lineWidth = 13
  g.beginPath()
  g.arc(400, 455, 70, 0.18 * Math.PI, 0.82 * Math.PI)
  g.stroke()
  if (avatar.glasses) {
    g.lineWidth = 9
    for (const x of [340, 460]) {
      g.beginPath()
      g.arc(x, 415, 42, 0, Math.PI * 2)
      g.stroke()
    }
    g.beginPath()
    g.moveTo(382, 412)
    g.lineTo(418, 412)
    g.stroke()
  }
  return canvas.toDataURL('image/jpeg', 0.9)
}

async function startServer(dataDir: string) {
  const server = spawn('node', ['.output/server/index.mjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(PORT),
      NUXT_DATA_DIR: dataDir,
      NUXT_APP_SECRET: randomBytes(32).toString('base64'),
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null)
      throw new Error('De server stopte direct; draait er al iets op poort ' + PORT + '?')
    try {
      if ((await fetch(BASE_URL)).ok) return server
    } catch {
      // nog niet klaar
    }
    await settle(200)
  }
  server.kill()
  throw new Error('De server start niet.')
}

async function createPerson(person: DemoPerson, photo: string) {
  const response = await fetch(`${BASE_URL}/api/entries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...person,
      consent: true,
      photo: { photo, original: photo, crop: { left: 0, top: 0, width: 800, height: 800 } },
    }),
  })
  if (!response.ok) throw new Error(`Aanmaken van ${person.name} mislukt: ${await response.text()}`)
}

async function open(page: Page, path: string, viewport: typeof PHONE | typeof DESKTOP) {
  await page.setViewport(viewport)
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await settle(500) // hydratie
}

async function save(page: Page, name: string, fullPage = true) {
  const file = new URL(`${name}.webp`, OUT_DIR)
  await page.screenshot({
    path: file.pathname as `${string}.webp`,
    type: 'webp',
    quality: 82,
    fullPage,
  })
  console.log(`Opgeslagen: docs/screenshots/${name}.webp`)
}

/** Vult het aanmeldformulier in, inclusief foto uitsnijden. */
async function fillForm(page: Page, photoFile: string) {
  const [chooser] = await Promise.all([
    page.waitForFileChooser(),
    page.locator('button::-p-text(Kies of maak een foto)').click(),
  ])
  await chooser.accept([photoFile])
  await page.waitForSelector('.vue-advanced-cropper')
  await settle(800)
  await page.locator('button::-p-text(Gebruik deze foto)').click()

  await page.locator('#name').fill(FORM_PERSON.name)
  await page.locator('label::-p-text(Reparateur)').click()
  await page.locator('label::-p-text(Gastvrouw)').click()
  await page.locator('#repairs').fill(FORM_PERSON.repairs!)
  await page.locator('#about').fill(FORM_PERSON.about)
  await page.locator('input[type=checkbox].accent-red').click()
  // Klaar met typen: geen focusrand of knipperende cursor in beeld
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await settle(300)
}

// ---------------------------------------------------------------------------

if (!existsSync(new URL('.output/server/index.mjs', ROOT))) {
  throw new Error('Geen build gevonden. Draai eerst `vp run build`.')
}

const tmp = await mkdtemp(join(tmpdir(), 'smoelenboek-screenshots-'))
await mkdir(OUT_DIR, { recursive: true })

const db = openDatabase(tmp)
db.prepare('INSERT INTO admins (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
  ADMIN.email,
  ADMIN.name,
  await hashPassword(ADMIN.password),
  new Date().toISOString(),
)
db.close()

const server = await startServer(tmp)
const browser = await launch({ executablePath: CHROME, args: ['--hide-scrollbars'] })
try {
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await page.goto(BASE_URL)

  // Avatars tekenen en de voorbeeldvrijwilligers aanmaken
  const formPhoto = await page.evaluate(drawAvatar, FORM_PERSON.avatar)
  const photoFile = join(tmp, 'sanne.jpg')
  await writeFile(photoFile, Buffer.from(formPhoto.split(',')[1]!, 'base64'))
  for (const person of PEOPLE)
    await createPerson(person, await page.evaluate(drawAvatar, person.avatar))

  // Formulier: desktop (alleen invullen) en mobiel (invullen en versturen)
  await open(page, '/', DESKTOP)
  await fillForm(page, photoFile)
  await save(page, 'formulier-desktop')

  await open(page, '/', PHONE)
  await fillForm(page, photoFile)
  await save(page, 'formulier-mobiel')

  await page.locator('button[type=submit]').click()
  await page.waitForSelector('::-p-text(Dankjewel!)')
  await page.evaluate(
    (from, to) => {
      for (const input of document.querySelectorAll<HTMLInputElement>('input[readonly]')) {
        input.value = input.value.replace(from, to)
      }
      window.scrollTo(0, 0)
    },
    BASE_URL,
    PUBLIC_URL,
  )
  await settle(500)
  await save(page, 'bedankt-mobiel')

  // Beheer
  await open(page, '/beheer/login', DESKTOP)
  await page.locator('#email').fill(ADMIN.email)
  await page.locator('#password').fill(ADMIN.password)
  await Promise.all([page.waitForNavigation(), page.locator('button[type=submit]').click()])
  const database = openDatabase(tmp)
  for (const person of PEOPLE.filter((p) => p.hidden)) {
    database.prepare('UPDATE people SET visible = 0 WHERE name = ?').run(person.name)
  }
  database.close()
  await open(page, '/beheer', { ...DESKTOP, height: 1250 })
  await save(page, 'beheer-desktop', false)

  // Beheerders: extra beheerders en twee openstaande uitnodigingen
  const adminsDb = openDatabase(tmp)
  for (const [email, name] of EXTRA_ADMINS) {
    adminsDb
      .prepare('INSERT INTO admins (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(
        email,
        name,
        await hashPassword(randomBytes(12).toString('hex')),
        new Date().toISOString(),
      )
  }
  adminsDb.close()
  await page.evaluate(async (name) => {
    await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }, INVITES[0])
  await open(page, '/beheer/beheerders', DESKTOP)
  await page.locator('#invite-name').fill(INVITES[1])
  await page.locator('button::-p-text(Uitnodigingslink maken)').click()
  await page.waitForSelector('input[aria-label=Uitnodigingslink]')
  const inviteUrl = await page.$eval(
    'input[aria-label=Uitnodigingslink]',
    (input) => (input as HTMLInputElement).value,
  )
  await page.evaluate(
    (from, to) => {
      for (const input of document.querySelectorAll<HTMLInputElement>('input[readonly]')) {
        input.value = input.value.replace(from, to)
      }
      ;(document.activeElement as HTMLElement | null)?.blur()
    },
    BASE_URL,
    PUBLIC_URL,
  )
  await settle(300)
  await save(page, 'beheerders-desktop')

  // Uitnodiging openen als de nieuwe beheerder (niet ingelogd)
  const guestContext = await browser.createBrowserContext()
  const guest = await guestContext.newPage()
  await open(guest, new URL(inviteUrl).pathname, PHONE)
  await guest.locator('#email').fill('fatima@example.nl')
  await guest.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await settle(300)
  await save(guest, 'uitnodiging-mobiel')
  await guestContext.close()

  // Eerste pagina van de PDF
  const pdf = await page.evaluate(async () => {
    const response = await fetch('/api/admin/smoelenboek')
    const bytes = new Uint8Array(await response.arrayBuffer())
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary)
  })
  const pdfFile = join(tmp, 'smoelenboek.pdf')
  await writeFile(pdfFile, Buffer.from(pdf, 'base64'))
  try {
    execFileSync('pdftoppm', [
      '-png',
      '-r',
      '150',
      '-f',
      '1',
      '-l',
      '1',
      '-singlefile',
      pdfFile,
      join(tmp, 'pdf'),
    ])
    const png = (await readFile(join(tmp, 'pdf.png'))).toString('base64')
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 })
    await page.setContent(
      `<body style="margin:0"><img src="data:image/png;base64,${png}" style="display:block;width:1240px"></body>`,
      { waitUntil: 'load' },
    )
    await save(page, 'pdf', false)
  } catch {
    console.warn('pdftoppm niet gevonden (pakket poppler-utils); PDF-screenshot overgeslagen.')
  }
} finally {
  await browser.close()
  server.kill()
  await rm(tmp, { recursive: true, force: true })
}
