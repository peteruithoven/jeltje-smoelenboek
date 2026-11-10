export default defineEventHandler((event) => {
  const person = findPersonByToken(getRouterParam(event, 'token'))
  const row = useDb().prepare('SELECT photo_original FROM people WHERE id = ?').get(person.id) as {
    photo_original: Uint8Array | null
  }
  return sendJpeg(event, row.photo_original)
})
