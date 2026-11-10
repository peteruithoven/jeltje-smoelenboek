<script setup lang="ts">
useHead({ title: 'Mijn gegevens' })

const route = useRoute()
const token = route.params.token as string

const { data: person, error: loadError } = await useFetch<PersonData>(`/api/entries/${token}`, {
  key: `entry-${token}`,
})

const form = ref(emptyForm())
const photo = ref(emptyPhoto())

function fill(data: PersonData) {
  form.value = {
    name: data.name,
    roles: [...data.roles],
    roleOther: data.roleOther,
    repairs: data.repairs,
    about: data.about,
    consent: true,
    website: '',
  }
  photo.value = data.hasPhoto
    ? {
        original: `/api/entries/${token}/original?v=${data.photoVersion}`,
        crop: data.photoCrop,
        preview: `/api/entries/${token}/photo?v=${data.photoVersion}`,
        photo: null,
      }
    : emptyPhoto()
}
if (person.value) fill(person.value)

const submitting = ref(false)
const error = ref('')
const saved = ref(false)

async function save() {
  submitting.value = true
  error.value = ''
  saved.value = false
  try {
    const data = await $fetch<PersonData>(`/api/entries/${token}`, {
      method: 'PUT',
      body: await toPayload(form.value, photo.value),
    })
    person.value = data
    fill(data)
    saved.value = true
    setTimeout(() => (saved.value = false), 4000)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}

const confirmingDelete = ref(false)
const deleting = ref(false)
const deleted = ref(false)

async function remove() {
  deleting.value = true
  error.value = ''
  try {
    await $fetch(`/api/entries/${token}`, { method: 'DELETE' })
    deleted.value = true
    window.scrollTo({ top: 0 })
  } catch (e) {
    error.value = errorMessage(e)
    confirmingDelete.value = false
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 sm:px-6">
    <!-- Verwijderd -->
    <div v-if="deleted" class="mx-auto max-w-2xl py-14">
      <h1 class="text-4xl"><span class="label-tag -rotate-2 bg-brown">Verwijderd</span></h1>
      <p class="mt-6 text-lg">
        Je gegevens en foto zijn verwijderd uit het smoelenboek. Jammer dat je gaat, en bedankt voor
        alles wat je voor Repair Café Jeltje doet!
      </p>
      <NuxtLink to="/" class="btn-secondary mt-8">Toch weer aanmelden</NuxtLink>
    </div>

    <!-- Ongeldige link -->
    <div v-else-if="loadError || !person" class="mx-auto max-w-2xl py-14">
      <h1 class="text-4xl">
        <span class="label-tag -rotate-2 bg-blue-dark">Link niet gevonden</span>
      </h1>
      <p class="mt-6 text-lg">
        Deze link werkt niet (meer). Misschien heb je jezelf al verwijderd, of is er een nieuwe link
        voor je aangemaakt.
      </p>
      <p class="mt-3 text-muted">
        Ben je je link kwijt? Vraag dan een van de coördinatoren van het Repair Café om een nieuwe
        link.
      </p>
      <NuxtLink to="/" class="btn-secondary mt-8">Naar het aanmeldformulier</NuxtLink>
    </div>

    <template v-else>
      <div class="max-w-2xl py-10 sm:py-14">
        <h1 class="text-4xl sm:text-5xl">
          Jouw gegevens
          <span class="label-tag mt-1 rotate-2 bg-blue-dark">aanpassen</span>
        </h1>
        <p class="mt-6 text-lg">Pas hieronder je gegevens of foto aan en klik op opslaan.</p>
        <p v-if="!person.visible" class="mt-4 border-l-4 border-blue bg-blue/10 p-3 text-sm">
          Je staat op dit moment niet zichtbaar in het smoelenboek. Vragen? Neem contact op met een
          van de coördinatoren.
        </p>
      </div>

      <PersonForm
        v-model:form="form"
        v-model:photo="photo"
        :submitting="submitting"
        :error="error"
        submit-label="Wijzigingen opslaan"
        @submit="save"
      >
        <template #actions>
          <Transition
            enter-from-class="opacity-0"
            enter-active-class="transition"
            leave-to-class="opacity-0"
            leave-active-class="transition"
          >
            <span v-if="saved" class="font-bold text-green" role="status">✓ Opgeslagen</span>
          </Transition>
        </template>
      </PersonForm>

      <div class="mt-16 grid gap-6 border-t-2 border-line pt-10 lg:grid-cols-2">
        <section>
          <h2 class="text-2xl">Je persoonlijke link</h2>
          <p class="mt-2 mb-4 text-sm text-muted">
            Bewaar deze link om later weer wijzigingen te kunnen maken. Deel 'm niet met anderen.
          </p>
          <EditLink :token="token" />
        </section>

        <section class="border-2 border-red/30 p-5">
          <h2 class="text-2xl">Uit het smoelenboek</h2>
          <p class="mt-2 mb-4 text-sm text-muted">
            Wil je niet meer in het smoelenboek? Dan verwijderen we je gegevens en foto direct en
            definitief.
          </p>
          <button
            v-if="!confirmingDelete"
            type="button"
            class="btn-danger"
            @click="confirmingDelete = true"
          >
            Verwijder mij
          </button>
          <div v-else class="space-y-3">
            <p class="font-bold">Weet je het zeker? Dit kan niet ongedaan worden gemaakt.</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn-primary" :disabled="deleting" @click="remove">
                {{ deleting ? 'Bezig…' : 'Ja, verwijder mij' }}
              </button>
              <button type="button" class="btn-secondary" @click="confirmingDelete = false">
                Annuleren
              </button>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
