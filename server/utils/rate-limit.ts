import type { H3Event } from 'h3'

const buckets = new Map<string, { count: number; resetAt: number }>()

/**
 * Eenvoudige in-memory rate limiter per IP-adres. Voldoende voor één Node-proces
 * (zoals op Alwaysdata); bij een herstart begint de telling opnieuw.
 */
export function rateLimit(event: H3Event, key: string, max: number, windowMs: number) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'onbekend'
  const id = `${key}:${ip}`
  const now = Date.now()
  let bucket = buckets.get(id)
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(id, bucket)
  }
  bucket.count++
  if (bucket.count > max) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Te veel verzoeken',
      message: 'Te veel pogingen. Probeer het over een tijdje opnieuw.',
    })
  }
  // Af en toe opruimen
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
  }
}
