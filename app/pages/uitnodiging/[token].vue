<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Uitnodiging beheer' })

const token = useRoute().params.token as string
const { data: invite, error: loadError } = await useFetch<{ name: string; expiresAt: string }>(
  `/api/invites/${token}`,
)

const { loggedIn, user, fetch: refreshSession } = useUserSession()

const form = ref({ name: invite.value?.name ?? '', email: '', password: '' })
const error = ref('')
const busy = ref(false)

async function accept() {
  busy.value = true
  error.value = ''
  try {
    await $fetch(`/api/invites/${token}`, { method: 'POST', body: form.value })
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
    <h1 class="mb-8 text-4xl"><span class="label-tag -rotate-2 bg-red">Welkom</span></h1>

    <div v-if="loadError || !invite" class="space-y-4 bg-white p-6 shadow-sm">
      <p role="alert">
        {{
          loadError
            ? errorMessage(loadError)
            : 'Deze uitnodiging is niet (meer) geldig. Vraag een beheerder om een nieuwe link.'
        }}
      </p>
      <NuxtLink to="/beheer/login" class="btn-secondary w-full">Naar inloggen</NuxtLink>
    </div>

    <form v-else class="space-y-5 bg-white p-6 shadow-sm" @submit.prevent="accept">
      <p>
        Je bent uitgenodigd als beheerder van het smoelenboek. Vul je gegevens in om je account aan
        te maken. Daarna log je in met je e-mailadres en wachtwoord.
      </p>
      <p v-if="loggedIn" class="text-sm text-muted">
        Je bent nu ingelogd als {{ user?.email }}. Als je deze uitnodiging accepteert, word je
        ingelogd met het nieuwe account.
      </p>
      <div>
        <label for="name" class="mb-1.5 block font-bold">Naam</label>
        <input
          id="name"
          v-model="form.name"
          class="input"
          autocomplete="name"
          maxlength="60"
          required
        />
      </div>
      <div>
        <label for="email" class="mb-1.5 block font-bold">E-mailadres</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="input"
          autocomplete="username"
          required
        />
      </div>
      <div>
        <label for="password" class="mb-1.5 block font-bold">Wachtwoord (min. 10 tekens)</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          class="input"
          autocomplete="new-password"
          minlength="10"
          required
        />
      </div>
      <p v-if="error" class="text-sm text-red-dark" role="alert">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="busy">
        {{ busy ? 'Bezig…' : 'Account aanmaken' }}
      </button>
      <p class="text-xs text-muted">
        Deze uitnodiging is geldig tot {{ formatDateTime(invite.expiresAt) }}.
      </p>
    </form>
  </div>
</template>
