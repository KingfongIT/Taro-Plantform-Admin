<template>
  <RouterView />
  <div v-if="isTestEnv" class="test-env-watermark" aria-hidden="true">
    <span>測試資料</span>
  </div>
  <ErrorComponent />
  <LoadingComponent />
  <ConfirmComponent />
</template>
<script setup>
import ErrorComponent from './components/ErrorComponent.vue'
import LoadingComponent from './components/LoadingComponent.vue'
import ConfirmComponent from './components/ConfirmComponent.vue'

const isTestEnv = import.meta.env.MODE === 'development' || import.meta.env.MODE === 'staging'
</script>

<style scoped></style>
