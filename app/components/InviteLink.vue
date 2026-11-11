<script setup lang="ts">
// Uitnodigingslink voor een nieuwe beheerder, om te mailen of te delen (bijv. via Signal).
const props = defineProps<{ token: string; name: string; expiresAt: string }>()

const url = computed(() => `${useRequestURL().origin}/uitnodiging/${props.token}`)
const text = computed(
  () =>
    `${props.name ? `Hoi ${props.name.split(' ')[0]}, je` : 'Je'} bent uitgenodigd als beheerder ` +
    `van het smoelenboek van Repair Café Jeltje. Via deze link maak je je account aan. ` +
    `De link is geldig tot ${formatDateTime(props.expiresAt)}.`,
)
</script>

<template>
  <div>
    <ShareLink
      :url="url"
      label="Uitnodigingslink"
      share-title="Uitnodiging beheer smoelenboek Repair Café Jeltje"
      :share-text="text"
      mail-label="Mailen"
    />
    <p class="mt-2 text-xs text-muted">
      Geldig tot {{ formatDateTime(expiresAt) }} en maar één keer te gebruiken. Deze link wordt maar
      één keer getoond; je kunt later wel een nieuwe maken.
    </p>
  </div>
</template>
