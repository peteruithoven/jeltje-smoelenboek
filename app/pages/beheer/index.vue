<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Beheer' })

const { data: people, refresh } = await useFetch<PersonData[]>('/api/admin/people', {
  default: () => [],
})

const filter = ref<'all' | 'visible' | 'hidden'>('all')
const search = ref('')
const visibleCount = computed(() => people.value.filter((p) => p.visible).length)

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return people.value.filter((person) => {
    if (filter.value === 'visible' && !person.visible) return false
    if (filter.value === 'hidden' && person.visible) return false
    if (!query) return true
    return [person.name, roleLabel(person), person.repairs, person.about]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const photoUrl = (person: PersonData) =>
  person.hasPhoto ? `/api/admin/people/${person.id}/photo?v=${person.photoVersion}` : null

const error = ref('')

async function setVisible(person: PersonData, visible: boolean) {
  error.value = ''
  const previous = person.visible
  person.visible = visible
  try {
    await $fetch(`/api/admin/people/${person.id}`, { method: 'PATCH', body: { visible } })
  } catch (e) {
    person.visible = previous
    error.value = errorMessage(e)
  }
}

// Bevestigingen: er staat steeds maar één vraag open
function askNewLink(person: PersonData) {
  confirmLink.value = person
  confirmDelete.value = null
}
function askDelete(person: PersonData) {
  confirmDelete.value = person
  confirmLink.value = null
}

// Nieuwe bewerklink
const newLink = ref<{ person: PersonData; token: string } | null>(null)
const confirmLink = ref<PersonData | null>(null)
async function createLink(person: PersonData) {
  error.value = ''
  try {
    const { token } = await $fetch<{ token: string }>(`/api/admin/people/${person.id}/token`, {
      method: 'POST',
    })
    newLink.value = { person, token }
    confirmLink.value = null
  } catch (e) {
    error.value = errorMessage(e)
  }
}

// Verwijderen
const confirmDelete = ref<PersonData | null>(null)
async function remove(person: PersonData) {
  error.value = ''
  try {
    await $fetch(`/api/admin/people/${person.id}`, { method: 'DELETE' })
    confirmDelete.value = null
    await refresh()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

const formUrl = computed(() => useRequestURL().origin + '/')
const copiedForm = ref(false)
async function copyFormUrl() {
  await navigator.clipboard.writeText(formUrl.value)
  copiedForm.value = true
  setTimeout(() => (copiedForm.value = false), 2500)
}

const dateFormat = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const formatDate = (iso: string) => dateFormat.format(new Date(iso))
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-4xl">Smoelenboek</h1>
        <p class="mt-1 text-muted">
          {{ people.length }} aanmeldingen · {{ visibleCount }} zichtbaar in het smoelenboek
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary" @click="copyFormUrl">
          {{ copiedForm ? 'Gekopieerd ✓' : 'Kopieer aanmeldlink' }}
        </button>
        <a href="/api/admin/smoelenboek?inline" target="_blank" class="btn-secondary">Bekijk PDF</a>
        <a href="/api/admin/smoelenboek" class="btn-primary" download>
          <svg
            viewBox="0 0 24 24"
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
          </svg>
          Download PDF
        </a>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="flex bg-white p-1 shadow-sm" role="tablist">
        <button
          v-for="option in [
            { value: 'all', label: 'Alle' },
            { value: 'visible', label: 'Zichtbaar' },
            { value: 'hidden', label: 'Verborgen' },
          ] as const"
          :key="option.value"
          type="button"
          role="tab"
          :aria-selected="filter === option.value"
          class="px-4 py-2 text-sm transition"
          :class="filter === option.value ? 'bg-ink text-white' : 'text-muted hover:text-ink'"
          @click="filter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <input
        v-model="search"
        type="search"
        placeholder="Zoeken…"
        class="input max-w-xs py-2"
        aria-label="Zoeken"
      />
    </div>

    <p
      v-if="error"
      class="mt-4 border-l-4 border-red bg-red/5 p-3 text-sm text-red-dark"
      role="alert"
    >
      {{ error }}
    </p>

    <p v-if="!people.length" class="mt-16 text-center text-muted">
      Nog niemand heeft zich aangemeld. Deel de aanmeldlink met de vrijwilligers!
    </p>
    <p v-else-if="!filtered.length" class="mt-16 text-center text-muted">Geen resultaten.</p>

    <ul class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="person in filtered" :key="person.id" class="flex flex-col bg-white shadow-sm">
        <div
          class="flex-1 px-5 pt-7 pb-6 transition"
          :class="{ 'opacity-40 grayscale': !person.visible }"
        >
          <PersonCard :person="person" :photo-url="photoUrl(person)" />
        </div>

        <div class="border-t border-line px-4 py-3">
          <label class="flex cursor-pointer items-center justify-between gap-3">
            <span class="text-sm font-bold">{{
              person.visible ? 'Zichtbaar in smoelenboek' : 'Verborgen'
            }}</span>
            <span class="relative inline-flex">
              <input
                type="checkbox"
                class="peer sr-only"
                :checked="person.visible"
                @change="setVisible(person, ($event.target as HTMLInputElement).checked)"
              />
              <span
                class="h-7 w-12 rounded-full bg-line transition peer-checked:bg-green peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-dark"
              />
              <span
                class="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
              />
            </span>
          </label>
          <p class="mt-1 text-xs text-muted">
            Aangemeld {{ formatDate(person.createdAt) }}
            <template v-if="person.updatedAt !== person.createdAt">
              · gewijzigd {{ formatDate(person.updatedAt) }}</template
            >
          </p>

          <!-- Nieuwe link -->
          <div v-if="newLink?.person.id === person.id" class="mt-3 bg-paper p-3">
            <p class="mb-2 text-sm">
              Nieuwe bewerklink voor {{ person.name }}. De oude link werkt niet meer.
            </p>
            <EditLink :token="newLink.token" for-admin />
            <button type="button" class="btn-ghost mt-1 min-h-9 text-sm" @click="newLink = null">
              Sluiten
            </button>
          </div>
          <div v-else-if="confirmLink?.id === person.id" class="mt-3 bg-paper p-3 text-sm">
            <p>Een nieuwe link maken? De huidige link van {{ person.name }} werkt dan niet meer.</p>
            <div class="mt-2 flex gap-2">
              <button type="button" class="btn-primary min-h-9 text-sm" @click="createLink(person)">
                Maak nieuwe link
              </button>
              <button type="button" class="btn-ghost min-h-9 text-sm" @click="confirmLink = null">
                Annuleren
              </button>
            </div>
          </div>
          <div v-else-if="confirmDelete?.id === person.id" class="mt-3 bg-red/5 p-3 text-sm">
            <p>{{ person.name }} definitief verwijderen, inclusief foto?</p>
            <div class="mt-2 flex gap-2">
              <button type="button" class="btn-primary min-h-9 text-sm" @click="remove(person)">
                Verwijderen
              </button>
              <button type="button" class="btn-ghost min-h-9 text-sm" @click="confirmDelete = null">
                Annuleren
              </button>
            </div>
          </div>
          <div v-else class="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              class="btn-ghost min-h-9 px-2 text-sm"
              @click="askNewLink(person)"
            >
              Nieuwe bewerklink
            </button>
            <button
              type="button"
              class="btn-ghost min-h-9 px-2 text-sm hover:!text-red-dark"
              @click="askDelete(person)"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
