<template>
  <v-dialog v-model="dialog.loading" persistent width="300">
    <v-card class="d-flex align-center justify-center py-8" height="120">
      <v-progress-circular indeterminate color="primary" size="64" :width="6" />
      <span class="ml-4">請稍後，系統運行中</span>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialog'
const dialog = useDialogStore()
</script>
