<template>
  <v-dialog v-model="dialog.confirmVisible" max-width="450">
    <v-card>
      <v-card-title>{{ dialog.confirmTitle }}</v-card-title>
      <v-card-text class="confirm-html" v-html="dialog.confirmMessage"></v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text color="secondary" variant="flat" @click="dialog.cancel">取消</v-btn>
        <v-btn :color="dialog.isDelete ? 'error' : 'primary'" variant="flat" @click="dialog.confirm"
          >確定</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialog'
const dialog = useDialogStore()
</script>

<style scoped>
:deep(.confirm-html ul) {
  margin: 0;
  padding-left: 1.25rem;
}

:deep(.confirm-html li) {
  margin: 0.25rem 0;
}
</style>
