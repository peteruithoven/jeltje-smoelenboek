<script setup lang="ts">
const form = defineModel<FormState>('form', { required: true })
const photo = defineModel<PhotoState>('photo', { required: true })
const props = defineProps<{ submitting?: boolean; error?: string; submitLabel: string }>()
const emit = defineEmits<{ submit: [] }>()

const attempted = ref(false)

const errors = computed(() => {
  const f = form.value
  return {
    photo: !photo.value.preview ? 'Voeg een foto toe.' : '',
    name: !f.name.trim() ? 'Vul je naam in.' : '',
    roles: f.roles.length === 0 ? 'Kies minimaal één rol.' : '',
    roleOther:
      f.roles.includes('anders') && !f.roleOther.trim() ? 'Wat doe je bij het Repair Café?' : '',
    consent: !f.consent ? 'Zonder toestemming kunnen we je niet opnemen in het smoelenboek.' : '',
  }
})
const hasErrors = computed(() => Object.values(errors.value).some(Boolean))
const show = (field: keyof typeof errors.value) => (attempted.value ? errors.value[field] : '')

function toggleRole(role: Role) {
  const roles = form.value.roles
  form.value.roles = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]
}

function onSubmit() {
  attempted.value = true
  if (hasErrors.value) {
    nextTick(() =>
      document
        .querySelector('[data-invalid="true"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    )
    return
  }
  emit('submit')
}

const length = (value: string) => value.length
const roleClasses: Record<RoleColor, string> = {
  red: 'peer-checked:border-red peer-checked:bg-red',
  blue: 'peer-checked:border-blue-dark peer-checked:bg-blue-dark',
  brown: 'peer-checked:border-brown peer-checked:bg-brown',
}
</script>

<template>
  <form
    class="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]"
    novalidate
    @submit.prevent="onSubmit"
  >
    <!-- Velden -->
    <div class="min-w-0 space-y-8">
      <section :data-invalid="!!show('photo')">
        <span class="field-label">Foto</span>
        <ClientOnly>
          <PhotoEditor v-model="photo" :invalid="!!show('photo')" />
          <template #fallback><div class="h-40 border-2 border-dashed border-line" /></template>
        </ClientOnly>
        <p v-if="show('photo')" class="mt-2 text-sm text-red-dark">{{ show('photo') }}</p>
      </section>

      <section :data-invalid="!!show('name')">
        <label for="name" class="field-label">Naam</label>
        <p class="field-hint">
          Zoals je bij het Repair Café genoemd wordt. Alleen je voornaam mag ook.
        </p>
        <input
          id="name"
          v-model="form.name"
          class="input"
          :class="{ '!border-red': show('name') }"
          autocomplete="name"
          :maxlength="LIMITS.name"
          required
        />
        <p v-if="show('name')" class="mt-2 text-sm text-red-dark">{{ show('name') }}</p>
      </section>

      <fieldset :data-invalid="!!(show('roles') || show('roleOther'))">
        <legend class="field-label">Wat doe je bij het Repair Café?</legend>
        <p class="field-hint">Je kunt meerdere rollen kiezen.</p>
        <div class="flex flex-wrap gap-2">
          <label v-for="role in ROLES" :key="role.value" class="cursor-pointer">
            <input
              type="checkbox"
              class="peer sr-only"
              :checked="form.roles.includes(role.value)"
              @change="toggleRole(role.value)"
            />
            <span
              class="inline-flex min-h-11 items-center gap-2 border-2 border-line bg-white px-4 font-display text-lg transition peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-dark hover:border-ink/40"
              :class="roleClasses[role.color]"
            >
              {{ role.label }}
            </span>
          </label>
        </div>
        <p v-if="show('roles')" class="mt-2 text-sm text-red-dark">{{ show('roles') }}</p>

        <div v-if="form.roles.includes('anders')" class="mt-4">
          <label for="roleOther" class="mb-1.5 block text-sm font-bold">Wat is je rol?</label>
          <input
            id="roleOther"
            v-model="form.roleOther"
            class="input"
            :class="{ '!border-red': show('roleOther') }"
            placeholder="Bijv. coördinator, fotograaf, kok"
            :maxlength="LIMITS.roleOther"
          />
          <p v-if="show('roleOther')" class="mt-2 text-sm text-red-dark">{{ show('roleOther') }}</p>
        </div>
      </fieldset>

      <section v-if="form.roles.includes('reparateur')">
        <label for="repairs" class="field-label">Wat repareer je graag?</label>
        <input
          id="repairs"
          v-model="form.repairs"
          class="input"
          placeholder="Bijv. naaimachines, lampen en kleine elektronica"
          :maxlength="LIMITS.repairs"
        />
        <p class="mt-1 text-right text-xs text-muted">
          {{ length(form.repairs) }}/{{ LIMITS.repairs }}
        </p>
      </section>

      <section>
        <label for="about" class="field-label">Vertel in één zin iets over jezelf</label>
        <p class="field-hint">Bijvoorbeeld je hobby, je vak of waarom je graag repareert.</p>
        <textarea
          id="about"
          v-model="form.about"
          class="input min-h-24 resize-y"
          rows="3"
          placeholder="Ik ben al 30 jaar fietsenmaker en word blij van een piepende rem."
          :maxlength="LIMITS.about"
        />
        <p
          class="mt-1 text-right text-xs"
          :class="length(form.about) >= LIMITS.about ? 'text-red-dark' : 'text-muted'"
        >
          {{ length(form.about) }}/{{ LIMITS.about }}
        </p>
      </section>

      <!-- Honeypot voor spambots -->
      <div class="absolute -left-[9999px]" aria-hidden="true">
        <label>Website <input v-model="form.website" tabindex="-1" autocomplete="off" /></label>
      </div>
    </div>

    <!-- Live voorbeeld -->
    <aside class="lg:col-start-2 lg:row-span-2 lg:row-start-1">
      <div class="lg:sticky lg:top-6">
        <h2 class="mb-3 text-center text-2xl text-muted lg:text-left">
          Zo kom je in het smoelenboek
        </h2>
        <div class="relative bg-paper px-6 pt-8 pb-10 shadow-[0_1px_0_var(--color-line)]">
          <div class="absolute inset-x-0 top-0 flex h-1">
            <span class="flex-1 bg-blue" /><span class="flex-1 bg-brown" /><span
              class="flex-1 bg-red"
            />
          </div>
          <PersonCard
            :person="form"
            :photo-url="photo.preview"
            placeholders
            class="mx-auto max-w-64"
          />
        </div>
      </div>
    </aside>

    <!-- Toestemming & versturen -->
    <div class="space-y-6">
      <label
        class="flex cursor-pointer gap-3 border-2 bg-white p-4 transition"
        :class="show('consent') ? 'border-red bg-red/5' : 'border-line hover:border-ink/30'"
        :data-invalid="!!show('consent')"
      >
        <input v-model="form.consent" type="checkbox" class="mt-1 size-5 shrink-0 accent-red" />
        <span class="text-sm leading-relaxed">
          Ik geef toestemming dat mijn foto en bovenstaande gegevens gebruikt worden voor het
          smoelenboek van Repair Café Jeltje. Het smoelenboek wordt alleen gedeeld binnen ons Repair
          Café. Ik kan mijn gegevens altijd aanpassen of verwijderen via mijn persoonlijke link.
        </span>
      </label>
      <p v-if="show('consent')" class="-mt-4 text-sm text-red-dark">{{ show('consent') }}</p>

      <p
        v-if="props.error"
        class="border-l-4 border-red bg-red/5 p-3 text-sm text-red-dark"
        role="alert"
      >
        {{ props.error }}
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn-primary w-full sm:w-auto" :disabled="submitting">
          {{ submitting ? 'Bezig met opslaan…' : submitLabel }}
        </button>
        <slot name="actions" />
      </div>
    </div>
  </form>
</template>
