export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const person = findPersonById(getRouterParam(event, 'id'))
  const { visible } = await readBody(event)
  if (typeof visible !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Ongeldige invoer' })
  }
  useDb()
    .prepare('UPDATE people SET visible = ? WHERE id = ?')
    .run(visible ? 1 : 0, person.id)
  return toPersonData(findPersonById(person.id))
})
