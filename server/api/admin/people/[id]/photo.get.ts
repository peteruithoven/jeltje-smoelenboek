export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const person = findPersonById(getRouterParam(event, 'id'))
  const row = useDb().prepare('SELECT photo FROM people WHERE id = ?').get(person.id) as {
    photo: Uint8Array | null
  }
  return sendJpeg(event, row.photo)
})
