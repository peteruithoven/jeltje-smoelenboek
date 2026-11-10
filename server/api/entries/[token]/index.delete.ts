export default defineEventHandler((event) => {
  const person = findPersonByToken(getRouterParam(event, 'token'))
  useDb().prepare('DELETE FROM people WHERE id = ?').run(person.id)
  // Ruimt verwijderde foto's ook echt op uit het databasebestand
  useDb().exec('VACUUM')
  return { deleted: true }
})
