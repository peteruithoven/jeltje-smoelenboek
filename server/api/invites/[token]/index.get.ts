// Openbaar: gegevens van een uitnodiging om het formulier voor in te vullen.
export default defineEventHandler((event) => {
  rateLimit(event, 'invite', 30, 15 * 60 * 1000)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const invite = findInviteByToken(getRouterParam(event, 'token'))
  return { name: invite.name, expiresAt: invite.expires_at }
})
