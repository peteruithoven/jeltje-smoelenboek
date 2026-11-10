<script setup lang="ts">
// Toont een persoonlijke bewerklink met knoppen om 'm te kopiëren, delen of mailen.
const props = defineProps<{ token: string; forAdmin?: boolean }>()

const url = computed(() => `${useRequestURL().origin}/bewerken/${props.token}`)
const copied = ref(false)
const canShare = ref(false)
onMounted(() => (canShare.value = typeof navigator.share === 'function'))

async function copy() {
  try {
    await navigator.clipboard.writeText(url.value)
  } catch {
    // Fallback voor oudere browsers
    const input = document.getElementById(`link-${props.token}`) as HTMLInputElement
    input.select()
    document.execCommand('copy')
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2500)
}

function share() {
  navigator
    .share({ title: 'Mijn link voor het smoelenboek van Repair Café Jeltje', url: url.value })
    .catch(() => {})
}

const mailto = computed(() => {
  const subject = 'Mijn link voor het smoelenboek van Repair Café Jeltje'
  const body = `Via deze link kan ik mijn gegevens in het smoelenboek van Repair Café Jeltje aanpassen of verwijderen:\n\n${url.value}`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})
</script>

<template>
  <div>
    <div class="flex flex-col gap-2 sm:flex-row">
      <input
        :id="`link-${token}`"
        :value="url"
        readonly
        class="input min-w-0 flex-1 bg-paper font-mono text-sm"
        aria-label="Persoonlijke bewerklink"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <button type="button" class="btn-primary shrink-0" @click="copy">
        {{ copied ? 'Gekopieerd ✓' : 'Kopieer link' }}
      </button>
    </div>
    <div class="mt-2 flex flex-wrap gap-2">
      <button v-if="canShare" type="button" class="btn-secondary min-h-10 text-sm" @click="share">
        Delen…
      </button>
      <a v-if="!forAdmin" :href="mailto" class="btn-secondary min-h-10 text-sm">Mail naar mezelf</a>
    </div>
  </div>
</template>
