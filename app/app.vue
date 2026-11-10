<script setup lang="ts">
useHead({
  titleTemplate: (title) =>
    title ? `${title} · Smoelenboek Repair Café Jeltje` : 'Smoelenboek Repair Café Jeltje',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
