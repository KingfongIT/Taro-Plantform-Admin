<template>
  <v-dialog v-model="dialog.errorVisible" width="400">
    <v-card>
      <v-card-title :class="['text-h6', dialog.isSuccess ? 'text-success' : 'text-error']">{{ dialog.errorTitle }}</v-card-title>
      <v-card-text class="text-center">{{ dialog.errorMessage }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="dialog.closeError">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialog'
const dialog = useDialogStore()
</script>
