export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = useDb()
    .prepare(`SELECT ${PERSON_COLUMNS} FROM people ORDER BY name COLLATE NOCASE`)
    .all() as unknown as PersonRow[]
  return rows.map(toPersonData)
})
