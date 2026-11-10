<script setup lang="ts">
const { user, clear } = useUserSession()

async function logout() {
  await clear()
  await navigateTo('/beheer/login')
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-paper">
    <header class="border-b border-line bg-white">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <NuxtLink to="/beheer" class="flex shrink-0 items-center gap-3">
          <img
            src="/logo.png"
            alt="Repair Café Jeltje"
            class="h-10 w-auto"
            width="900"
            height="343"
          />
          <span class="font-display text-xl text-muted">Beheer</span>
        </NuxtLink>
        <nav v-if="user" class="ml-auto flex items-center gap-1 text-sm">
          <NuxtLink to="/beheer" class="btn-ghost min-h-9" exact-active-class="!text-ink !bg-paper"
            >Smoelenboek</NuxtLink
          >
          <NuxtLink
            to="/beheer/beheerders"
            class="btn-ghost min-h-9"
            active-class="!text-ink !bg-paper"
            >Beheerders</NuxtLink
          >
          <button class="btn-ghost min-h-9" @click="logout">Uitloggen</button>
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
