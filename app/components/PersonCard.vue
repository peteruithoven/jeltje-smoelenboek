<script setup lang="ts">
// Eén kaartje zoals het in het smoelenboek komt. Gebruikt voor de live preview én in het beheer.
const props = defineProps<{
  person: PersonFields
  photoUrl?: string | null
  /** Toon voorbeeldteksten voor lege velden (voor de preview tijdens het invullen) */
  placeholders?: boolean
}>()

const color = computed(() => COLORS[roleColor(props.person.roles)])
const name = computed(() => props.person.name.trim() || (props.placeholders ? 'Je naam' : ''))
const tilt = computed(() => labelTilt(props.person.name.trim() || 'Je naam'))
const role = computed(() => roleLabel(props.person) || (props.placeholders ? 'Je rol' : ''))
const repairs = computed(() =>
  props.person.roles.includes('reparateur') ? props.person.repairs.trim() : '',
)
const about = computed(() => props.person.about.trim())
</script>

<template>
  <article class="flex flex-col items-center text-center">
    <div class="relative size-36 shrink-0">
      <div
        class="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-full transition-colors"
        :style="{ backgroundColor: color }"
      />
      <img
        v-if="photoUrl"
        :src="photoUrl"
        :alt="`Foto van ${person.name}`"
        class="relative size-full rounded-full bg-paper object-cover"
      />
      <div
        v-else
        class="relative grid size-full place-items-center rounded-full bg-white text-line"
      >
        <svg viewBox="0 0 24 24" class="size-20" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="8.5" r="4.5" />
          <path d="M3.5 21c.8-4.4 4.2-7 8.5-7s7.7 2.6 8.5 7z" />
        </svg>
      </div>
    </div>

    <h3
      class="label-tag mt-4 max-w-full text-2xl break-words transition-colors"
      :class="{ 'opacity-60': !person.name.trim() }"
      :style="{ backgroundColor: color, rotate: `${tilt}deg` }"
    >
      {{ name }}
    </h3>

    <p
      v-if="role"
      class="mt-2.5 text-sm text-muted"
      :class="{ 'italic opacity-60': !roleLabel(person) }"
    >
      {{ role }}
    </p>
    <p v-if="repairs" class="mt-1 text-sm text-green">Repareert graag: {{ repairs }}</p>
    <p v-if="about" class="mt-2 text-sm leading-snug break-words italic">“{{ about }}”</p>
    <p v-else-if="placeholders" class="mt-2 text-sm italic text-muted/60">
      “Iets over jezelf in één zin.”
    </p>
  </article>
</template>
