// Nieuwe aanmelding voor het smoelenboek (openbaar)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'create', 20, 60 * 60 * 1000)
  const input = await readPersonInput(event, { photoRequired: true })
  const { token, hash } = createToken()
  const now = new Date().toISOString()
  const id = newPersonId()

  useDb()
    .prepare(
      `INSERT INTO people (id, token_hash, name, roles, role_other, repairs, about,
        photo, photo_original, photo_crop, photo_updated_at, consent_at, visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    .run(
      id,
      hash,
      input.name,
      JSON.stringify(input.roles),
      input.roleOther,
      input.repairs,
      input.about,
      input.photo!.photo,
      input.photo!.original,
      JSON.stringify(input.photo!.crop),
      now,
      now,
      now,
      now,
    )

  setResponseStatus(event, 201)
  return { token }
})
