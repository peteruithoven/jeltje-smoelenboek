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

interface Invite {
  id: number
  name: string
  createdBy: string | null
  createdAt: string
  expiresAt: string
  expired: boolean
}
interface InviteLinkData {
  id: number
  token: string
  expiresAt: string
}

const { data: invites, refresh: refreshInvites } = await useFetch<Invite[]>('/api/admin/invites', {
  default: () => [],
})

const inviteName = ref('')
const inviteError = ref('')
/** De zojuist gemaakte uitnodiging, met link (die wordt maar één keer getoond) */
const newInvite = ref<(InviteLinkData & { name: string }) | null>(null)
async function invite() {
  inviteError.value = ''
  try {
    const result = await $fetch<InviteLinkData>('/api/admin/invites', {
      method: 'POST',
      body: { name: inviteName.value },
    })
    newInvite.value = { ...result, name: inviteName.value.trim() }
    inviteName.value = ''
    await refreshInvites()
  } catch (e) {
    inviteError.value = errorMessage(e)
  }
}

/** Een opnieuw gemaakte link bij een bestaande uitnodiging */
const renewedLink = ref<InviteLinkData | null>(null)
async function renewInvite(id: number) {
  const result = await $fetch<{ token: string; expiresAt: string }>(
    `/api/admin/invites/${id}/token`,
    { method: 'POST' },
  )
  if (newInvite.value?.id === id) newInvite.value = null
  renewedLink.value = { id, ...result }
  await refreshInvites()
}

const confirmRevoke = ref<number | null>(null)
async function revokeInvite(id: number) {
  await $fetch(`/api/admin/invites/${id}`, { method: 'DELETE' })
  confirmRevoke.value = null
  if (newInvite.value?.id === id) newInvite.value = null
  if (renewedLink.value?.id === id) renewedLink.value = null
  await refreshInvites()
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
      <div class="space-y-6 self-start">
        <ul class="divide-y divide-line bg-white shadow-sm">
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
                <button
                  type="button"
                  class="btn-ghost min-h-9 text-sm"
                  @click="confirmRemove = null"
                >
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

        <section v-if="invites.length" aria-labelledby="invites-title">
          <h2 id="invites-title" class="mb-2 text-2xl">Uitnodigingen</h2>
          <ul class="divide-y divide-line bg-white shadow-sm">
            <li v-for="item in invites" :key="item.id" class="px-5 py-4">
              <div class="flex flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <p class="font-bold">
                    {{ item.name || 'Zonder naam' }}
                    <span
                      v-if="item.expired"
                      class="ml-1 bg-paper px-1.5 py-0.5 text-xs font-normal text-muted"
                      >Verlopen</span
                    >
                  </p>
                  <p class="text-sm text-muted">
                    <template v-if="item.expired">Verlopen op</template>
                    <template v-else>Geldig tot</template>
                    {{ formatDateTime(item.expiresAt) }}
                    <template v-if="item.createdBy">
                      · uitgenodigd door {{ item.createdBy }}</template
                    >
                  </p>
                </div>
                <div v-if="confirmRevoke === item.id" class="flex gap-2">
                  <button
                    type="button"
                    class="btn-primary min-h-9 text-sm"
                    @click="revokeInvite(item.id)"
                  >
                    Intrekken
                  </button>
                  <button
                    type="button"
                    class="btn-ghost min-h-9 text-sm"
                    @click="confirmRevoke = null"
                  >
                    Annuleren
                  </button>
                </div>
                <div v-else class="flex gap-2">
                  <button
                    type="button"
                    class="btn-ghost min-h-9 text-sm"
                    @click="renewInvite(item.id)"
                  >
                    Nieuwe link
                  </button>
                  <button
                    type="button"
                    class="btn-ghost min-h-9 text-sm"
                    @click="confirmRevoke = item.id"
                  >
                    Intrekken
                  </button>
                </div>
              </div>
              <div v-if="renewedLink?.id === item.id" class="mt-3" role="status">
                <p class="mb-2 text-sm">De oude link werkt niet meer. Stuur deze nieuwe link:</p>
                <InviteLink
                  :token="renewedLink.token"
                  :name="item.name"
                  :expires-at="renewedLink.expiresAt"
                />
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div class="space-y-6">
        <form class="space-y-4 bg-white p-5 shadow-sm" @submit.prevent="invite">
          <h2 class="text-2xl">Beheerder uitnodigen</h2>
          <p class="text-sm text-muted">
            Maak een persoonlijke link die je kunt mailen of delen via bijvoorbeeld Signal. De
            nieuwe beheerder vult zelf naam, e-mailadres en wachtwoord in. De link is een week
            geldig.
          </p>
          <div>
            <label for="invite-name" class="mb-1 block text-sm font-bold"
              >Naam
              <span class="font-normal text-muted">(optioneel, wordt voor-ingevuld)</span></label
            >
            <input
              id="invite-name"
              v-model="inviteName"
              class="input py-2"
              autocomplete="off"
              maxlength="60"
            />
          </div>
          <p v-if="inviteError" class="text-sm text-red-dark" role="alert">{{ inviteError }}</p>
          <button type="submit" class="btn-primary w-full">Uitnodigingslink maken</button>
          <div v-if="newInvite" class="border-t border-line pt-4" role="status">
            <p class="mb-2 text-sm font-bold">
              Stuur deze link naar {{ newInvite.name || 'de nieuwe beheerder' }}:
            </p>
            <InviteLink
              :token="newInvite.token"
              :name="newInvite.name"
              :expires-at="newInvite.expiresAt"
            />
          </div>
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
