export default defineEventHandler((event) => {
  const person = findPersonByToken(getRouterParam(event, 'token'))
  const row = useDb().prepare('SELECT photo FROM people WHERE id = ?').get(person.id) as {
    photo: Uint8Array | null
  }
  return sendJpeg(event, row.photo)
})
