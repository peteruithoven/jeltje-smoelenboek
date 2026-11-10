export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return useDb()
    .prepare('SELECT id, email, name, created_at AS createdAt FROM admins ORDER BY name, email')
    .all() as { id: number; email: string; name: string; createdAt: string }[]
})
