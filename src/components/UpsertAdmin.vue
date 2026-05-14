<template>
  <v-card class="mx-auto" min-width="300">
    <v-card-title class="d-flex align-center">
      {{ isEdit ? '編輯帳號' : '新增帳號' }}
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="emit('close')" icon="close"></v-btn>
    </v-card-title>
    <v-card-text>
      <v-form v-model="valid" @submit.prevent="onSubmit">
        <v-text-field
          v-model="userName"
          label="名稱"
          variant="outlined"
          density="compact"
          :rules="[rules.required]"
          class="mb-3"
        />

        <v-text-field
          v-model="email"
          label="Email"
          variant="outlined"
          density="compact"
          type="email"
          :rules="rules.emailRules"
          class="mb-3"
          :disabled="isEdit"
        />

        <!-- 角色多選 -->
        <v-select
          v-model="selectedRoles"
          :items="roleOptions"
          item-title="label"
          item-value="value"
          label="角色"
          variant="outlined"
          density="compact"
          :rules="[rules.required]"
          multiple
          chips
          clearable
          class="mb-3"
        />
        <div class="text-caption">
          {{ isEdit ? '變更後將立即生效。' : '建立完成後，會將使用者密碼設定寄到 Email。' }}
        </div>

        <v-btn color="primary" type="submit" :loading="submitting" block :disabled="!valid">
          {{ isEdit ? '儲存變更' : '建立帳號' }}
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { useProductRules } from '@/utils/rules'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

// 決定模式 & 編輯資料
const props = defineProps({
  mode: {
    type: String,
    default: 'create', // 'create' | 'edit'
  },
  userId: {
    type: String,
    default: () => null,
  },
})

// 🔍 判斷是否為編輯模式
const isEdit = computed(() => props.mode === 'edit')

const emit = defineEmits(['close', 'saved'])
const rules = useProductRules()

const valid = ref(true)
const dialog = useDialogStore()

const router = useRouter()

const userName = ref('')
const email = ref('')

const roleOptions = ref([])
const selectedRoles = ref([])

const submitting = ref(false)

async function onSubmit() {
  if (!valid.value) return
  submitting.value = true

  try {
    const payload = {
      userName: userName.value,
      email: email.value,
      roles: selectedRoles.value,
    }

    if (isEdit.value) {
      //  編輯模式：呼叫更新 API（路徑依照你後端調整）
      console.log('編輯')
      await api.put(`/admin/${props.userId}`, payload)
      // dialog.showSuccess('更新成功', '帳號資料已更新。')
    } else {
      //  新增模式：呼叫建立 API
      await api.post('/admin', payload)
      // dialog.showSuccess('建立成功', '管理者建立成功，已寄出設定密碼信件。')
    }
    emit('saved') // 通知父層「已儲存」（建立或更新皆可）
    emit('close') // 關閉 dialog
  } catch (err) {
    dialog.showAxiosError(err, isEdit.value ? '更新失敗' : '建立失敗')
  } finally {
    submitting.value = false
  }
}

// 載入角色 + 如果是編輯模式就帶入初始值
onMounted(async () => {
  try {
    const { data } = await api.get('/roles/GetRoleName')

    roleOptions.value = data.map((r) => ({
      value: r,
      label: r,
    }))
  } catch (err) {
    dialog.showError('讀取角色失敗', err?.message || '請稍後再試')
  }

  if (isEdit.value) {
    const { data } = await api.get(`/admin/${props.userId}`)

    // 帶入編輯資料
    userName.value = data.userName
    email.value = data.email
    selectedRoles.value = data.roles
  }
})
</script>
