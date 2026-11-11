<script setup lang="ts">
// Toont een link met knoppen om 'm te kopiëren, delen (bijv. via Signal) of mailen.
const props = defineProps<{
  url: string
  label: string
  shareTitle: string
  /** Tekst die bij delen en mailen vóór de link komt */
  shareText?: string
  /** Tekst van de mailknop; zonder deze prop is er geen mailknop */
  mailLabel?: string
}>()

const id = useId()
const copied = ref(false)
const canShare = ref(false)
onMounted(() => (canShare.value = typeof navigator.share === 'function'))

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
  } catch {
    // Fallback voor oudere browsers
    const input = document.getElementById(id) as HTMLInputElement
    input.select()
    document.execCommand('copy')
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2500)
}

function share() {
  navigator
    .share({
      title: props.shareTitle,
      text: props.shareText ? `${props.shareText}\n\n${props.url}` : undefined,
      url: props.shareText ? undefined : props.url,
    })
    .catch(() => {})
}

const mailto = computed(() => {
  const body = props.shareText ? `${props.shareText}\n\n${props.url}` : props.url
  return `mailto:?subject=${encodeURIComponent(props.shareTitle)}&body=${encodeURIComponent(body)}`
})
</script>

<template>
  <div>
    <div class="flex flex-col gap-2 sm:flex-row">
      <input
        :id="id"
        :value="url"
        readonly
        class="input min-w-0 flex-1 bg-paper font-mono text-sm"
        :aria-label="label"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <button type="button" class="btn-primary shrink-0" @click="copy">
        {{ copied ? 'Gekopieerd ✓' : 'Kopieer link' }}
      </button>
    </div>
    <div v-if="canShare || mailLabel" class="mt-2 flex flex-wrap gap-2">
      <button v-if="canShare" type="button" class="btn-secondary min-h-10 text-sm" @click="share">
        Delen…
      </button>
      <a v-if="mailLabel" :href="mailto" class="btn-secondary min-h-10 text-sm">{{ mailLabel }}</a>
    </div>
  </div>
</template>
