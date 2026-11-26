import PDFDocument from 'pdfkit'

export interface PdfPerson extends PersonFields {
  photo: Uint8Array | null
}

// A4 in punten
const PAGE = { width: 595.28, height: 841.89 }
const MARGIN = 36
const COLS = 3
const ROWS = 3
const GAP_X = 16
const GAP_Y = 10
const HEADER_HEIGHT = 64
const FOOTER_HEIGHT = 18
const PHOTO = 96

const GREY = '#5f5d59'
const LIGHT = '#f4f1ec'

/** Volgorde en titels van de groepen in de PDF. Gastvrouw en gastheer zijn dezelfde rol. */
const GROUPS: { title: string; roles: Role[] }[] = [
  { title: 'Reparateurs', roles: ['reparateur'] },
  { title: 'Gastvrouwen & gastheren', roles: ['gastvrouw', 'gastheer'] },
  { title: 'Andere rollen', roles: ['anders'] },
]
const MULTIPLE_ROLES = 'Meerdere rollen'

/** Deelt mensen in per groep; wie in meer dan één groep valt, komt bij "Meerdere rollen". */
function groupByRole(people: PdfPerson[]) {
  const groups = [...GROUPS.map((group) => group.title), MULTIPLE_ROLES].map((title) => ({
    title,
    people: [] as PdfPerson[],
  }))
  for (const person of people) {
    const matches = GROUPS.filter((group) =>
      group.roles.some((role) => person.roles.includes(role)),
    )
    const index = matches.length === 1 ? GROUPS.indexOf(matches[0]!) : GROUPS.length
    groups[index]!.people.push(person)
  }
  return groups.filter((group) => group.people.length > 0)
}

/** Emoji e.d. zitten niet in de fonts; die laten we weg in de PDF. */
function clean(text: string) {
  return text
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u{FE0F}|\u{200D}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function asset(name: string): Promise<Buffer> {
  const data = await useStorage('assets:server').getItemRaw(name)
  if (!data) throw new Error(`Asset ontbreekt: ${name}`)
  return Buffer.from(data as Uint8Array)
}

export async function renderSmoelenboek(people: PdfPerson[]): Promise<Buffer> {
  const [display, displayBold, body, italic, logo] = await Promise.all([
    asset('fonts/BloggerSans.otf'),
    asset('fonts/BloggerSans-Bold.ttf'),
    asset('fonts/ABeeZee-Regular.ttf'),
    asset('fonts/ABeeZee-Italic.ttf'),
    asset('img/logo.png'),
  ])

  const date = new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    autoFirstPage: false,
    font: body as unknown as string, // voorkomt dat pdfkit Helvetica van schijf laadt
    info: {
      Title: 'Smoelenboek Repair Café Jeltje',
      Author: 'Repair Café Jeltje',
      Subject: `Smoelenboek ${date} – alleen voor intern gebruik`,
    },
  })
  doc.registerFont('display', display)
  doc.registerFont('display-bold', displayBold)
  // De Bold-versie van Blogger Sans heeft ascent/descent 0 in de hhea-tabel (browsers gebruiken
  // OS/2, pdfkit niet). Zonder correctie staat de tekst boven het label. Neem de waarden van de
  // Regular over; het fontbestand zelf passen we niet aan (licentie CC BY-ND).
  const bold = (doc.font('display-bold') as unknown as { _font: Record<string, number> })._font
  bold.ascender = 760
  bold.descender = -240
  doc.registerFont('body', body)
  doc.registerFont('italic', italic)

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  // Elke groep begint op een nieuwe pagina
  const perPage = COLS * ROWS
  const pages = groupByRole(people).flatMap((group) =>
    Array.from({ length: Math.ceil(group.people.length / perPage) }, (_, i) => ({
      title: group.title,
      people: group.people.slice(i * perPage, (i + 1) * perPage),
    })),
  )
  if (pages.length === 0) pages.push({ title: 'Smoelenboek', people: [] })
  const pageCount = pages.length
  const contentWidth = PAGE.width - MARGIN * 2
  const colWidth = (contentWidth - GAP_X * (COLS - 1)) / COLS
  const gridTop = MARGIN + HEADER_HEIGHT
  const gridHeight = PAGE.height - MARGIN - FOOTER_HEIGHT - gridTop
  const rowHeight = (gridHeight - GAP_Y * (ROWS - 1)) / ROWS

  pages.forEach((page, pageIndex) => {
    doc.addPage()
    drawHeader(doc, logo, date, page.title)
    drawFooter(doc, pageIndex + 1, pageCount)

    page.people.forEach((person, index) => {
      const col = index % COLS
      const row = Math.floor(index / COLS)
      drawCard(
        doc,
        person,
        MARGIN + col * (colWidth + GAP_X),
        gridTop + row * (rowHeight + GAP_Y),
        colWidth,
        rowHeight,
      )
    })

    if (people.length === 0) {
      doc
        .font('body')
        .fontSize(12)
        .fillColor(GREY)
        .text('Er staan nog geen mensen (zichtbaar) in het smoelenboek.', MARGIN, gridTop + 40, {
          width: contentWidth,
          align: 'center',
        })
    }
  })

  doc.end()
  return done
}

function drawHeader(doc: PDFKit.PDFDocument, logo: Buffer, date: string, title: string) {
  const logoHeight = 44
  doc.image(logo, MARGIN, MARGIN - 4, { height: logoHeight })

  const right = PAGE.width - MARGIN
  doc
    .font('display')
    .fontSize(28)
    .fillColor(COLORS.ink)
    .text(title, MARGIN, MARGIN - 2, { width: right - MARGIN, align: 'right' })
  const subtitle = title === 'Smoelenboek' ? 'Repair Café Jeltje' : 'Smoelenboek Repair Café Jeltje'
  doc
    .font('body')
    .fontSize(9)
    .fillColor(GREY)
    .text(`${subtitle} · ${date}`, MARGIN, MARGIN + 28, {
      width: right - MARGIN,
      align: 'right',
    })

  // Drie gekleurde streepjes in de kleuren van het logo
  const y = MARGIN + logoHeight + 6
  const segment = (right - MARGIN) / 3
  ;[COLORS.blue, COLORS.brown, COLORS.red].forEach((color, i) => {
    doc.rect(MARGIN + i * segment, y, segment, 3).fill(color)
  })
}

function drawFooter(doc: PDFKit.PDFDocument, page: number, pageCount: number) {
  const y = PAGE.height - MARGIN - 8
  const width = PAGE.width - MARGIN * 2
  // Voorkom dat pdfkit een nieuwe pagina begint omdat de footer in de ondermarge staat
  doc.page.margins.bottom = 0
  doc.font('body').fontSize(7.5).fillColor(GREY)
  doc.text('Alleen voor intern gebruik binnen Repair Café Jeltje', MARGIN, y, {
    width,
    lineBreak: false,
  })
  doc.text(`${page} / ${pageCount}`, MARGIN, y, { width, align: 'right', lineBreak: false })
}

function drawCard(
  doc: PDFKit.PDFDocument,
  person: PdfPerson,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const color = COLORS[roleColor(person.roles)]
  const centerX = x + width / 2
  const radius = PHOTO / 2
  const photoY = y + 6

  // Speelse gekleurde "schaduw" achter de foto
  doc.circle(centerX + 4, photoY + radius + 4, radius).fill(color)

  doc.save()
  doc.circle(centerX, photoY + radius, radius).clip()
  if (person.photo) {
    doc.image(Buffer.from(person.photo), centerX - radius, photoY, {
      width: PHOTO,
      height: PHOTO,
    })
  } else {
    doc.rect(centerX - radius, photoY, PHOTO, PHOTO).fill(LIGHT)
  }
  doc.restore()

  // Naam in een gekanteld label, net als in het logo
  let cursor = photoY + PHOTO + 12
  const name = clean(person.name)
  const maxTextWidth = width - 24
  let fontSize = 15
  doc.font('display-bold')
  // Eerst iets kleiner maken; past het dan nog niet, dan over twee regels
  while (fontSize > 12 && doc.fontSize(fontSize).widthOfString(name) > maxTextWidth) fontSize -= 0.5
  const textOptions = { width: maxTextWidth, align: 'center' as const, lineGap: -1 }
  const singleLine = doc.widthOfString(name) <= maxTextWidth
  const textWidth = singleLine ? doc.widthOfString(name) : maxTextWidth
  const textHeight = singleLine ? fontSize : doc.heightOfString(name, textOptions) - fontSize * 0.2
  const padX = 7
  const padY = 3
  const labelWidth = textWidth + padX * 2
  const labelHeight = textHeight + padY * 2
  const labelX = centerX - labelWidth / 2

  doc.save()
  doc.rotate(labelTilt(person.name), { origin: [centerX, cursor + labelHeight / 2] })
  doc.roundedRect(labelX, cursor, labelWidth, labelHeight, 3).fill(color)
  doc.fillColor('#ffffff').text(name, labelX + padX, cursor + padY + fontSize * 0.08, {
    ...textOptions,
    width: textWidth,
    height: fontSize * 2.6,
    ellipsis: true,
  })
  doc.restore()
  cursor += labelHeight + 8

  const role = clean(roleLabel(person))
  if (role) {
    doc.font('body').fontSize(9).fillColor(COLORS.ink)
    doc.text(role, x, cursor, { width, align: 'center', height: 12, ellipsis: true })
    cursor += 13
  }

  const repairs = clean(person.repairs)
  if (repairs) {
    const label = `Repareert graag: ${repairs}`
    const maxHeight = 34 // max. 3 regels
    const options = { width, align: 'center' as const, height: maxHeight, ellipsis: true }
    doc.font('body').fontSize(8.5).fillColor(COLORS.green)
    doc.text(label, x, cursor, options)
    cursor += Math.min(doc.heightOfString(label, { width }), maxHeight) + 4
  }

  const about = clean(person.about)
  if (about) {
    const remaining = Math.max(y + height - cursor + GAP_Y / 2, 11)
    const text = `“${about}”`
    const options = { width: width - 8, align: 'center' as const, lineGap: 0.5 }
    // Liever iets kleiner dan afgekapt
    let size = 8.5
    doc.font('italic').fontSize(size)
    while (size > 6.5 && doc.heightOfString(text, options) > remaining) doc.fontSize((size -= 0.5))
    doc.fillColor(GREY).text(text, x + 4, cursor, { ...options, height: remaining, ellipsis: true })
  }
}
