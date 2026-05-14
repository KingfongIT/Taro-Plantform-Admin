<template>
  <v-dialog v-model="showWarning" persistent max-width="400">
    <v-card>
      <v-card-title class="text-h6">
        <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
        Token即將過期
      </v-card-title>

      <v-card-text>
        <p>您的登入狀態即將過期，請重新登入以繼續使用系統。</p>
        <p class="text-caption text-grey">剩餘時間：{{ remainingMinutes }} 分鐘</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="handleRenew" :loading="renewing"> 重新登入 </v-btn>
        <v-btn color="grey" variant="text" @click="handleDismiss"> 稍後處理 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const renewing = ref(false)

// 計算是否顯示警告
const showWarning = computed(() => {
  const remainingMinutes = authStore.getTokenRemainingTime
  return remainingMinutes > 0 && remainingMinutes <= 5
})

// 剩餘時間
const remainingMinutes = computed(() => {
  return authStore.getTokenRemainingTime
})

// 處理重新登入
const handleRenew = async () => {
  renewing.value = true
  try {
    // 登出並跳轉到登入頁面
    await authStore.logout()
  } finally {
    renewing.value = false
  }
}

// 處理稍後處理
const handleDismiss = () => {
  // 這裡可以添加邏輯來延遲警告顯示
  console.log('用戶選擇稍後處理token過期警告')
}

// 監聽token狀態變化
watch(
  () => authStore.token,
  (newToken) => {
    if (!newToken) {
      // token被清除，不需要顯示警告
      return
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
}
</style>
