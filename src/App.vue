<template>
  <RouterView />
  <ErrorComponent />
  <LoadingComponent />
  <ConfirmComponent />
</template>
<script setup>
import ErrorComponent from './components/ErrorComponent.vue'
import LoadingComponent from './components/LoadingComponent.vue'
import ConfirmComponent from './components/ConfirmComponent.vue'
</script>

<style scoped></style>
