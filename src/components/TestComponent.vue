<template>
  <h1>測試元件</h1>
</template>
<script setup>
import { onBeforeUnmount, onUnmounted } from 'vue'

onBeforeUnmount(() => console.log('onBeforeUnmount'))
onUnmounted(() => console.log('onUnmounted'))
</script>
<style scoped>
h1 {
  background-color: blue;
}
</style>
