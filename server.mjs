// Startscript voor productie (bijv. Alwaysdata).
// Alwaysdata geeft het IP-adres en de poort door via de variabelen IP en PORT;
// Nitro luistert naar HOST en PORT.
if (process.env.IP && !process.env.HOST) process.env.HOST = process.env.IP

if (!process.env.NUXT_APP_SECRET) {
  console.error('NUXT_APP_SECRET ontbreekt. Genereer er een met: openssl rand -base64 32')
  process.exit(1)
}

await import('./.output/server/index.mjs')
