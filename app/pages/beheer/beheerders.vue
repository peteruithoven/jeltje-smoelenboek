<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Beheerders' })

interface Admin {
  id: number
  email: string
  name: string
  createdAt: string
}

const { user } = useUserSession()
const { data: admins, refresh } = await useFetch<Admin[]>('/api/admin/admins', {
  default: () => [],
})

const newAdmin = ref({ email: '', name: '', password: '' })
const addError = ref('')
const addSuccess = ref('')
async function add() {
  addError.value = ''
  addSuccess.value = ''
  try {
    await $fetch('/api/admin/admins', { method: 'POST', body: newAdmin.value })
    addSuccess.value = `${newAdmin.value.email} is toegevoegd. Geef het wachtwoord op een veilige manier door.`
    newAdmin.value = { email: '', name: '', password: '' }
    await refresh()
  } catch (e) {
    addError.value = errorMessage(e)
  }
}

const confirmRemove = ref<number | null>(null)
async function remove(id: number) {
  await $fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
  confirmRemove.value = null
  await refresh()
}

const passwords = ref({ currentPassword: '', newPassword: '' })
const passwordError = ref('')
const passwordSuccess = ref(false)
async function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = false
  try {
    await $fetch('/api/admin/password', { method: 'POST', body: passwords.value })
    passwords.value = { currentPassword: '', newPassword: '' }
    passwordSuccess.value = true
  } catch (e) {
    passwordError.value = errorMessage(e)
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 class="text-4xl">Beheerders</h1>
    <p class="mt-1 text-muted">
      Beheerders kunnen alle aanmeldingen zien en het smoelenboek downloaden.
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <ul class="divide-y divide-line self-start bg-white shadow-sm">
        <li
          v-for="admin in admins"
          :key="admin.id"
          class="flex flex-wrap items-center gap-3 px-5 py-4"
        >
          <div class="min-w-0 flex-1">
            <p class="font-bold">
              {{ admin.name || admin.email }}
              <span v-if="admin.id === user?.id" class="ml-1 text-xs font-normal text-muted"
                >(jij)</span
              >
            </p>
            <p v-if="admin.name" class="truncate text-sm text-muted">{{ admin.email }}</p>
          </div>
          <template v-if="admin.id !== user?.id">
            <div v-if="confirmRemove === admin.id" class="flex gap-2">
              <button type="button" class="btn-primary min-h-9 text-sm" @click="remove(admin.id)">
                Verwijderen
              </button>
              <button type="button" class="btn-ghost min-h-9 text-sm" @click="confirmRemove = null">
                Annuleren
              </button>
            </div>
            <button
              v-else
              type="button"
              class="btn-ghost min-h-9 text-sm"
              @click="confirmRemove = admin.id"
            >
              Verwijderen
            </button>
          </template>
        </li>
      </ul>

      <div class="space-y-6">
        <form class="space-y-4 bg-white p-5 shadow-sm" @submit.prevent="add">
          <h2 class="text-2xl">Beheerder toevoegen</h2>
          <div>
            <label for="admin-name" class="mb-1 block text-sm font-bold">Naam</label>
            <input id="admin-name" v-model="newAdmin.name" class="input py-2" autocomplete="off" />
          </div>
          <div>
            <label for="admin-email" class="mb-1 block text-sm font-bold">E-mailadres</label>
            <input
              id="admin-email"
              v-model="newAdmin.email"
              type="email"
              class="input py-2"
              autocomplete="off"
              required
            />
          </div>
          <div>
            <label for="admin-password" class="mb-1 block text-sm font-bold"
              >Wachtwoord (min. 10 tekens)</label
            >
            <input
              id="admin-password"
              v-model="newAdmin.password"
              type="password"
              class="input py-2"
              autocomplete="new-password"
              minlength="10"
              required
            />
          </div>
          <p v-if="addError" class="text-sm text-red-dark" role="alert">{{ addError }}</p>
          <p v-if="addSuccess" class="text-sm text-green" role="status">{{ addSuccess }}</p>
          <button type="submit" class="btn-primary w-full">Toevoegen</button>
        </form>

        <form class="space-y-4 bg-white p-5 shadow-sm" @submit.prevent="changePassword">
          <h2 class="text-2xl">Mijn wachtwoord wijzigen</h2>
          <input :value="user?.email" autocomplete="username" class="hidden" readonly />
          <div>
            <label for="current-password" class="mb-1 block text-sm font-bold"
              >Huidig wachtwoord</label
            >
            <input
              id="current-password"
              v-model="passwords.currentPassword"
              type="password"
              class="input py-2"
              autocomplete="current-password"
              required
            />
          </div>
          <div>
            <label for="new-password" class="mb-1 block text-sm font-bold">Nieuw wachtwoord</label>
            <input
              id="new-password"
              v-model="passwords.newPassword"
              type="password"
              class="input py-2"
              autocomplete="new-password"
              minlength="10"
              required
            />
          </div>
          <p v-if="passwordError" class="text-sm text-red-dark" role="alert">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="text-sm text-green" role="status">
            Je wachtwoord is gewijzigd.
          </p>
          <button type="submit" class="btn-secondary w-full">Wachtwoord wijzigen</button>
        </form>
      </div>
    </div>
  </div>
</template>
