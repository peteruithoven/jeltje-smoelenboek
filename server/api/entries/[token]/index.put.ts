export default defineEventHandler(async (event) => {
  rateLimit(event, 'update', 60, 60 * 60 * 1000)
  const person = findPersonByToken(getRouterParam(event, 'token'))
  const input = await readPersonInput(event, { photoRequired: false })
  const now = new Date().toISOString()
  const db = useDb()

  db.prepare(
    `UPDATE people SET name = ?, roles = ?, role_other = ?, repairs = ?, about = ?,
      consent_at = ?, updated_at = ? WHERE id = ?`,
  ).run(
    input.name,
    JSON.stringify(input.roles),
    input.roleOther,
    input.repairs,
    input.about,
    now,
    now,
    person.id,
  )

  if (input.photo) {
    db.prepare(
      `UPDATE people SET photo = ?, photo_original = ?, photo_crop = ?, photo_updated_at = ?
       WHERE id = ?`,
    ).run(input.photo.photo, input.photo.original, JSON.stringify(input.photo.crop), now, person.id)
  }

  return toPersonData(findPersonById(person.id))
})
