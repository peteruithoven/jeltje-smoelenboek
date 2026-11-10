import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['vue-advanced-cropper'] },
  },
  nitro: {
    // Ingebouwde SQLite van Node.js (>= 22.13)
    rollupConfig: { external: ['node:sqlite'] },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'nl' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'theme-color', content: '#fc4237' },
        // Bewerklinks bevatten een geheim token: nooit doorgeven aan andere sites
        { name: 'referrer', content: 'no-referrer' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
  runtimeConfig: {
    // Map met de SQLite database. Overschrijf met NUXT_DATA_DIR.
    dataDir: '.data',
    session: {
      // Beheerders blijven 7 dagen ingelogd
      maxAge: 60 * 60 * 24 * 7,
    },
  },
})
