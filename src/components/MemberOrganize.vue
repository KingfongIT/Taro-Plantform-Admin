<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-3" color="primary">inventory</v-icon>
        <span>組織與代理資訊</span>

        <v-spacer />

        <v-btn variant="outlined" color="primary" @click="openOrgTree"> 組織圖 </v-btn>
      </v-card-title>

      <v-card-text>
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div class="d-flex align-center flex-wrap">
            <span class="mr-2">推薦人：</span>

            <v-chip v-if="referrer?.email" class="mr-2">
              {{ referrer.email }}
            </v-chip>

            <span class="mr-2">
              {{ referrer?.referrerName ?? '無推薦人' }}
            </span>
          </div>
          <div class="d-flex align-center flex-wrap">
            <span class="mr-2">推廣人數：</span>
            <span class="text-medium-emphasis"> ({{ referCount }}人) </span>
          </div>

          <div class="d-flex align-center">
            <v-btn
              class="mr-3"
              variant="text"
              color="primary"
              @click="referrerHistoryDialog = true"
            >
              更換紀錄
            </v-btn>

            <v-btn variant="text" color="primary" @click="openReferrerDialog"> 更換 </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>

  <!-- 更換推薦人 -->
  <v-dialog v-model="referrerDialog" max-width="400">
    <v-card>
      <v-card-title>選擇推薦人</v-card-title>

      <v-card-text>
        <v-text-field
          v-model="searchReferrer"
          density="compact"
          placeholder="搜尋名稱或 Email"
          :loading="referrerLoading"
          clearable
        />

        <v-table v-if="referrerOptions.length > 0" hover>
          <thead :style="{ background: '#F5F5F5' }">
            <tr>
              <th>姓名</th>
              <th>Email</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in referrerOptions"
              :key="item.guid"
              :style="rowReferrerStyle(item)"
              style="cursor: pointer"
              @click="selectedReferrer = item"
            >
              <td>{{ item.name ?? '無名稱' }}</td>
              <td>{{ item.email }}</td>
            </tr>
          </tbody>
        </v-table>

        <div v-else class="text-center border pa-3">
          <span v-if="!searchReferrer.trim()">請輸入名稱或 Email 搜尋</span>
          <span v-else>查無結果</span>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="tonal" @click="cancelReferrerDialog">取消</v-btn>
        <v-btn
          variant="flat"
          color="primary"
          :disabled="!selectedReferrer"
          @click="saveReferrerDialog"
        >
          確認
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 組織圖 -->
  <v-dialog v-model="orgTreeDialog" width="900">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>組織圖</span>
        <v-btn icon="close" variant="text" @click="orgTreeDialog = false" />
      </v-card-title>

      <v-divider />

      <v-card-text style="max-height: 70vh; overflow: auto">
        <OrgTree :root-guid="rootGuid" />
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="orgTreeDialog = false">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 推薦人更換紀錄 -->
  <v-dialog v-model="referrerHistoryDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>推薦人更換紀錄</span>
        <v-spacer />
        <v-btn icon="close" variant="text" @click="referrerHistoryDialog = false" />
      </v-card-title>

      <v-card-text>
        <ReferrerHistory v-if="referrerHistoryDialog" :agent-guid="rootGuid" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import OrgTree from './OrgTree.vue'
import ReferrerHistory from './ReferrerHistory.vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { useDebouncedAsync } from '@/utils/debounce'

const props = defineProps({
  guid: String,
})

const dialog = useDialogStore()

// dialogs
const orgTreeDialog = ref(false)
const referrerDialog = ref(false)
const referrerHistoryDialog = ref(false)

// data
const rootGuid = computed(() => props.guid)
const referrer = ref(null)
const referCount = ref(0)

const referrerLoading = ref(false)
const referrerOptions = ref([])
const searchReferrer = ref('')
const selectedReferrer = ref(null)

async function fetchReferrer() {
  try {
    const { data } = await api.get(`/Referrer/${props.guid}`)
    referrer.value = data.referrer
    referCount.value = data.count
  } catch (error) {
    dialog.showAxiosError(error, '資料抓取錯誤')
  }
}

function openOrgTree() {
  orgTreeDialog.value = true
}

function openReferrerDialog() {
  referrerDialog.value = true
}

function rowReferrerStyle(item) {
  return selectedReferrer.value?.guid === item.guid ? { background: '#E3F2FD' } : {}
}

async function fetchAccount() {
  const keyword = searchReferrer.value.trim()

  // 沒輸入就不要打 API，並清空結果
  if (!keyword) {
    referrerOptions.value = []
    return
  }

  referrerLoading.value = true
  try {
    const { data } = await api.get('/Account/Filter', {
      params: { search: keyword },
    })
    referrerOptions.value = data
  } catch (error) {
    dialog.showAxiosError(error, '資料抓取錯誤')
  } finally {
    referrerLoading.value = false
  }
}

const debounceSearchReferrer = useDebouncedAsync(fetchAccount, 300)

function cancelReferrerDialog() {
  referrerDialog.value = false
  referrerOptions.value = []
  searchReferrer.value = ''
  selectedReferrer.value = null
}

async function saveReferrerDialog() {
  if (!selectedReferrer.value) return

  const ok = await dialog.askConfirm({
    title: '確認變更推薦人嗎?',
    message:
      '確認後，將變更推薦人。\n所屬的組織線會一併轉移。\n未來代理人的組織佣金將發放給新的推薦人。',
    isDelete: true,
  })

  if (!ok) return

  dialog.showLoading()
  try {
    const payload = {
      ...selectedReferrer.value,
      // ⚠️ 你原本用到 user.value.currentPayGradeId，但這段程式碼內沒有 user
      // 這裡先保留原結構，你要嘛補上 user，要嘛移除這個欄位
      // currentPayGradeId: user.value.currentPayGradeId,
    }

    await api.patch(`/Referrer/${props.guid}`, payload)

    await fetchReferrer()
    cancelReferrerDialog()
  } catch (error) {
    dialog.showAxiosError(error, '推薦人更換失敗')
  } finally {
    dialog.hideLoading()
  }
}

watch(searchReferrer, async () => {
  await debounceSearchReferrer()
})

onMounted(async () => {
  await fetchReferrer()
})
</script>
