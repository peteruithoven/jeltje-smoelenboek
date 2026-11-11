/** Bijv. "dinsdag 18 november 14:05". Vaste tijdzone, zodat server en browser hetzelfde tonen. */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
