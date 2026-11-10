export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (id === admin.id) {
    throw createError({ statusCode: 400, message: 'Je kunt jezelf niet verwijderen.' })
  }
  useDb().prepare('DELETE FROM admins WHERE id = ?').run(id)
  return { deleted: true }
})
