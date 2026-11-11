// Trekt een uitnodiging in; de link werkt daarna niet meer.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  useDb()
    .prepare('DELETE FROM admin_invites WHERE id = ?')
    .run(Number(getRouterParam(event, 'id')))
  return { deleted: true }
})
