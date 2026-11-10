// Maakt een nieuwe bewerklink aan (bijv. als iemand de eigen link kwijt is).
// De oude link werkt daarna niet meer.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const person = findPersonById(getRouterParam(event, 'id'))
  const { token, hash } = createToken()
  useDb().prepare('UPDATE people SET token_hash = ? WHERE id = ?').run(hash, person.id)
  return { token }
})
