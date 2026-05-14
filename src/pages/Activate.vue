<template>
  <v-container class="py-8 d-flex align-center justify-center" style="min-height: 100vh">
    <v-card border max-width="400" class="w-100">
      <v-card-title>設定您的管理者密碼</v-card-title>

      <v-card-text>
        <v-alert v-if="!userId || !token" type="error" density="compact" class="mb-4">
          連結無效或缺少參數，請確認您是從最新的郵件連結進入。
        </v-alert>

        <template v-else>
          <!-- 這裡顯示要更改的帳號名稱 / Email -->
          <v-alert type="info" density="comfortable" class="mb-4">
            <div>正在為以下帳號設定密碼：</div>
            <strong>{{ displayAccount }}</strong>
          </v-alert>

          <v-form @submit.prevent="onSubmit" v-model="valid">
            <div class="text-caption text-grey mt-1">
              密碼規則：至少 6 碼，需包含小寫英文和數字組合。
            </div>
            <v-text-field
              v-model="password"
              label="新密碼"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'visibility' : 'visibility_off'"
              :rules="passwordRules"
              required
              autocomplete="new-password"
              @click:append-inner="showPassword = !showPassword"
            />

            <v-text-field
              v-model="confirmPassword"
              label="確認新密碼"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'visibility' : 'visibility_off'"
              :rules="confirmPasswordRules"
              required
              autocomplete="new-password"
              @click:append-inner="showPassword = !showPassword"
            />

            <v-btn
              type="submit"
              color="primary"
              block
              class="mt-4"
              :loading="loading"
              :disabled="!valid || loading"
            >
              送出
            </v-btn>
          </v-form>

          <v-alert v-if="errorMessage" type="error" density="compact" class="mt-4">
            {{ errorMessage }}
          </v-alert>

          <v-alert v-if="successMessage" type="success" density="compact" class="mt-4">
            {{ successMessage }}
            <div v-if="countdown > 0" class="mt-2">
              {{ countdown }} 秒後將自動跳轉至登入頁，
              <a :href="baseUrl" @click.prevent="goLogin()">立即前往</a>
            </div>
          </v-alert>
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const baseUrl = import.meta.env.VITE_API_URL + '/login'

const userId = route.query.userId
const token = route.query.token
// 從 query 讀 email（是你後端 callbackUrl 帶來的）
const email = route.query.email

// 顯示名稱：有 email 顯示 email，未來如果有 userName 也可以換成 userName
const displayAccount = computed(() => email || '(未知帳號)')

const showPassword = ref(false)

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const valid = ref(true)

// 倒數秒數
const countdown = ref(0)
// 存 interval id，方便清掉
let countdownTimer = null

const passwordRules = [
  (v) => !!v || '密碼必填',
  (v) => v.length >= 6 || '密碼至少 6 碼',
  (v) => /\d/.test(v) || '密碼至少需包含一個數字',
  (v) => /[A-Za-z]/.test(v) || '密碼至少需包含一個英文字母',
]

const confirmPasswordRules = [
  (v) => !!v || '確認密碼必填',
  (v) => v === password.value || '兩次輸入的密碼不一致',
]

function goLogin() {
  router.push({ name: 'Login' })
}

const onSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!userId || !token) {
    errorMessage.value = '連結無效，請重新從信件進入。'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  loading.value = true

  try {
    const res = await api.post('/admin/activate', {
      id: userId,
      token, // 後端會自己 Base64UrlDecode
      newPassword: password.value,
    })

    successMessage.value = res.data?.message || '密碼設定成功，帳號已啟用，您現在可以登入。'

    // 5 秒後導去登入頁
    countdown.value = 5
    countdownTimer = setInterval(() => {
      if (countdown.value > 1) {
        countdown.value -= 1
      } else {
        clearInterval(countdownTimer)
        countdownTimer = null
        goLogin()
      }
    }, 1000)
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.response?.data ||
      '設定密碼失敗，連結可能已失效或密碼不符合規則。'
    errorMessage.value = msg
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>
