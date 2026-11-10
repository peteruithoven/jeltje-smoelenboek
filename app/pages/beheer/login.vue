<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Inloggen beheer' })

const { loggedIn, fetch: refreshSession } = useUserSession()
if (loggedIn.value) await navigateTo('/beheer')

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function login() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession()
    await navigateTo('/beheer')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm px-4 py-16">
    <h1 class="mb-8 text-4xl"><span class="label-tag -rotate-2 bg-red">Inloggen</span></h1>
    <form class="space-y-5 bg-white p-6 shadow-sm" @submit.prevent="login">
      <div>
        <label for="email" class="mb-1.5 block font-bold">E-mailadres</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="input"
          autocomplete="username"
          required
        />
      </div>
      <div>
        <label for="password" class="mb-1.5 block font-bold">Wachtwoord</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="input"
          autocomplete="current-password"
          required
        />
      </div>
      <p v-if="error" class="text-sm text-red-dark" role="alert">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="busy">
        {{ busy ? 'Bezig…' : 'Inloggen' }}
      </button>
    </form>
  </div>
</template>
