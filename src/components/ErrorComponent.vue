<template>
  <v-dialog v-model="dialog.errorVisible" max-width="680">
    <v-card>
      <v-card-title :class="['text-h6', dialog.isSuccess ? 'text-success' : 'text-error']">
        {{ dialog.errorTitle }}
      </v-card-title>
      <v-card-text class="error-content">
        <template v-if="dialog.errorDetails?.type === 'ESUN'">
          <v-alert color="error" variant="tonal" density="compact" class="mb-4">
            <div class="d-flex flex-wrap align-center ga-2">
              <span class="font-weight-bold">玉山銀行回覆：{{ dialog.errorDetails.bankMessage || '交易失敗' }}</span>
              <v-chip v-if="dialog.errorDetails.code" size="small" color="error" variant="flat">
                {{ dialog.errorDetails.code }}
              </v-chip>
            </div>
          </v-alert>

          <div v-if="dialog.errorDetails.items?.length" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">重複進件案件</div>
            <v-table density="compact" class="error-table">
              <thead>
                <tr>
                  <th>案件編號</th>
                  <th>原因</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in dialog.errorDetails.items" :key="item.txSeq">
                  <td class="font-weight-medium text-no-wrap">{{ item.txSeq }}</td>
                  <td>{{ item.message }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <div class="text-caption text-grey-darken-1 mb-3">
            <span v-if="dialog.errorDetails.msgId">MsgId：{{ dialog.errorDetails.msgId }}</span>
            <span v-if="dialog.errorDetails.responseTime" class="ml-3">回覆時間：{{ dialog.errorDetails.responseTime }}</span>
          </div>

          <v-expansion-panels v-if="dialog.errorDetails.rawMessage || dialog.errorDetails.rawResponse" variant="accordion">
            <v-expansion-panel title="原始錯誤資訊">
              <v-expansion-panel-text>
                <pre class="raw-error">{{ dialog.errorDetails.rawMessage || JSON.stringify(dialog.errorDetails.rawResponse, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>

        <div v-else class="text-body-2 error-message">{{ dialog.errorMessage }}</div>
      </v-card-text>
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

<style scoped>
.error-content {
  max-height: 70vh;
  overflow: auto;
}

.error-message {
  white-space: pre-line;
  word-break: break-word;
}

.error-table {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.raw-error {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.5;
}
</style>
