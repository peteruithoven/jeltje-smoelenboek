export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const person = findPersonById(getRouterParam(event, 'id'))
  useDb().prepare('DELETE FROM people WHERE id = ?').run(person.id)
  useDb().exec('VACUUM')
  return { deleted: true }
})
