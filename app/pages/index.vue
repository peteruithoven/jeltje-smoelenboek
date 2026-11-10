<script setup lang="ts">
useHead({ title: 'Doe mee' })

const form = ref(emptyForm())
const photo = ref(emptyPhoto())
const submitting = ref(false)
const error = ref('')
const token = ref<string | null>(null)

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const result = await $fetch('/api/entries', {
      method: 'POST',
      body: await toPayload(form.value, photo.value),
    })
    token.value = result.token
    window.scrollTo({ top: 0 })
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 sm:px-6">
    <!-- Bedankt -->
    <div v-if="token" class="mx-auto max-w-2xl py-10 sm:py-14">
      <h1 class="text-4xl sm:text-5xl">
        <span class="label-tag -rotate-2 bg-green">Dankjewel!</span>
      </h1>
      <p class="mt-6 text-lg">
        Je staat erin. Zo kom je in het smoelenboek van Repair Café Jeltje:
      </p>
      <div class="my-8 bg-paper px-6 py-10">
        <PersonCard :person="form" :photo-url="photo.preview" class="mx-auto max-w-64" />
      </div>

      <div class="border-2 border-ink p-5 sm:p-6">
        <h2 class="text-2xl">Bewaar je persoonlijke link</h2>
        <p class="mt-2 mb-4 text-muted">
          Met deze link kun je later je gegevens en foto aanpassen, of jezelf weer uit het
          smoelenboek verwijderen. <strong class="text-ink">Bewaar 'm goed</strong>, bijvoorbeeld
          door 'm naar jezelf te mailen. Iedereen met deze link kan je gegevens aanpassen, dus deel
          'm niet.
        </p>
        <EditLink :token="token" />
      </div>
    </div>

    <!-- Formulier -->
    <template v-else>
      <div class="max-w-2xl py-10 sm:py-14">
        <h1 class="text-4xl sm:text-5xl">
          Doe mee met ons
          <span class="label-tag mt-1 rotate-2 bg-red">smoelenboek!</span>
        </h1>
        <p class="mt-6 text-lg leading-relaxed">
          Bij Repair Café Jeltje werken we met veel vrijwilligers. Om elkaar beter te leren kennen
          maken we een smoelenboek. Vul hieronder je gegevens in, dan zie je meteen hoe je erin komt
          te staan.
        </p>
        <p class="mt-3 text-sm text-muted">
          Het smoelenboek wordt alleen gedeeld binnen ons Repair Café. Na het opslaan krijg je een
          persoonlijke link waarmee je alles later kunt aanpassen of verwijderen.
        </p>
      </div>

      <PersonForm
        v-model:form="form"
        v-model:photo="photo"
        :submitting="submitting"
        :error="error"
        submit-label="Zet me in het smoelenboek"
        @submit="submit"
      />
    </template>
  </div>
</template>
