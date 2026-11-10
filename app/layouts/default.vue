<template>
  <div class="flex min-h-dvh flex-col">
    <header class="border-b border-line bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NuxtLink to="/" class="shrink-0" aria-label="Smoelenboek Repair Café Jeltje">
          <img
            src="/logo.png"
            alt="Repair Café Jeltje"
            class="h-12 w-auto sm:h-14"
            width="900"
            height="343"
          />
        </NuxtLink>
        <span class="font-display text-xl text-muted sm:text-2xl">Smoelenboek</span>
      </div>
    </header>
    <main class="flex-1">
      <slot />
    </main>
    <footer class="mt-16 bg-ink text-sm text-white/70">
      <div
        class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6"
      >
        <span>Repair Café Jeltje · Buurtsalon Jeltje · Amsterdam Oud-West</span>
        <a
          href="https://repaircafejeltje.nl/"
          class="underline-offset-2 hover:text-white hover:underline"
          >repaircafejeltje.nl</a
        >
      </div>
    </footer>
  </div>
</template>
