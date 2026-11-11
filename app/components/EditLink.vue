<script setup lang="ts">
// Toont een persoonlijke bewerklink met knoppen om 'm te kopiëren, delen of mailen.
const props = defineProps<{ token: string; forAdmin?: boolean }>()

const url = computed(() => `${useRequestURL().origin}/bewerken/${props.token}`)
</script>

<template>
  <ShareLink
    :url="url"
    label="Persoonlijke bewerklink"
    share-title="Mijn link voor het smoelenboek van Repair Café Jeltje"
    :share-text="
      forAdmin
        ? undefined
        : 'Via deze link kan ik mijn gegevens in het smoelenboek van Repair Café Jeltje aanpassen of verwijderen:'
    "
    :mail-label="forAdmin ? undefined : 'Mail naar mezelf'"
  />
</template>
