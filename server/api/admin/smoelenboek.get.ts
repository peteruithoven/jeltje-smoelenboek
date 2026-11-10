// Download het smoelenboek als PDF (alleen zichtbare personen)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = useDb()
    .prepare(
      `SELECT name, roles, role_other, repairs, about, photo FROM people
       WHERE visible = 1 ORDER BY name COLLATE NOCASE`,
    )
    .all() as {
    name: string
    roles: string
    role_other: string
    repairs: string
    about: string
    photo: Uint8Array | null
  }[]

  const pdf = await renderSmoelenboek(
    rows.map((row) => ({
      name: row.name,
      roles: JSON.parse(row.roles),
      roleOther: row.role_other,
      repairs: row.repairs,
      about: row.about,
      photo: row.photo,
    })),
  )

  const date = new Date().toISOString().slice(0, 10)
  const inline = getQuery(event).inline !== undefined
  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="smoelenboek-repair-cafe-jeltje-${date}.pdf"`,
  })
  return pdf
})
