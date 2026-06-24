<template>
  <v-container fluid class="pa-6">
    <div class="main-title mb-4">
      <h2 class="text-h5 font-weight-bold">手動加扣款</h2>
      <p class="text-subtitle-2 text-grey-darken-1">
        搜尋會員後手動加值或扣除雞肉飼料（正數加款、負數扣款），系統會留下操作紀錄。
      </p>
    </div>

    <v-row>
      <!-- 左：搜尋與選擇會員 -->
      <v-col cols="12" md="5">
        <v-card border flat class="pa-4 h-100">
          <div class="text-subtitle-1 font-weight-bold mb-3">搜尋會員</div>
          <v-text-field
            v-model="search"
            prepend-inner-icon="search"
            placeholder="輸入姓名或 Email 搜尋"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :loading="searchLoading"
            @update:model-value="onSearchInput"
            @click:clear="clearSearch"
          />
          <div class="text-caption text-grey mt-1">
            姓名來源：<strong>會員資料</strong>（Profile）與
            <strong>合約資料</strong>（ContractProfile）兩種，下方會分別標示。
          </div>

          <v-list
            v-if="searchResults.length"
            class="mt-2"
            density="compact"
            max-height="420"
            style="overflow-y: auto"
          >
            <v-list-item
              v-for="acc in searchResults"
              :key="acc.accountGuid"
              :active="selectedAccount?.accountGuid === acc.accountGuid"
              rounded="lg"
              class="mb-1 border"
              @click="selectAccount(acc)"
            >
              <div class="d-flex flex-column py-1">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <v-chip size="small" color="indigo" variant="tonal" label>會員姓名</v-chip>
                  <span class="font-weight-medium">{{ acc.profileName || '—' }}</span>
                  <div class="px-1"></div>
                  <v-chip size="small" color="teal" variant="tonal" label>合約姓名</v-chip>
                  <span class="font-weight-medium">{{ acc.contractRealName || '—' }}</span>
                </div>
                <div class="text-body-2 text-grey-darken-1 py-1">
                  {{ acc.email || '（無 Email）' }}
                </div>
                <div class="text-body-2">
                  目前飼料：<strong>{{ formatNumber(acc.balance) }}</strong>
                </div>
              </div>
            </v-list-item>
          </v-list>
          <div v-else-if="searched && !searchLoading" class="text-center text-grey py-6">
            <v-icon size="40" class="mb-2">search_off</v-icon>
            <div class="text-body-2">查無符合的會員</div>
          </div>
        </v-card>
      </v-col>

      <!-- 右：加扣款表單 + 歷史 -->
      <v-col cols="12" md="7">
        <v-card border flat class="pa-4 mb-4">
          <div class="text-subtitle-1 font-weight-bold mb-3">加扣款</div>

          <div v-if="!selectedAccount" class="text-center text-grey py-8">
            <v-icon size="40" class="mb-2">person_search</v-icon>
            <div class="text-caption">請先從左側搜尋並選擇一位會員</div>
          </div>

          <template v-else>
            <v-alert variant="tonal" color="primary" density="comfortable" class="mb-4">
              <div class="d-flex justify-space-between align-center flex-wrap ga-2">
                <div>
                  <div class="text-body-2">
                    <strong>會員姓名：</strong>{{ selectedAccount.profileName || '—' }}
                    <div class="px-1"></div>
                    <strong>合約姓名：</strong>{{ selectedAccount.contractRealName || '—' }}
                  </div>
                  <div class="text-caption text-grey-darken-2">{{ selectedAccount.email }}</div>
                </div>
                <div class="text-right">
                  <div class="text-caption text-grey-darken-1">目前飼料</div>
                  <div class="text-h6 font-weight-bold">{{ formatNumber(currentBalance) }}</div>
                </div>
              </div>
            </v-alert>

            <v-form ref="adjustForm">
              <v-text-field
                v-model.number="amount"
                type="number"
                label="調整數量（正數加款 / 負數扣款）"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :rules="[amountRule]"
                hint="例如 100 = 加 100；-50 = 扣 50"
                persistent-hint
              />

              <v-textarea
                v-model="note"
                label="調整原因（必填）"
                variant="outlined"
                density="comfortable"
                rows="2"
                auto-grow
                class="mb-2"
                :rules="[(v) => !!(v && v.trim()) || '請填寫原因']"
              />

              <template v-if="Number(amount) > 0">
                <v-checkbox
                  v-model="setExpiry"
                  label="設定到期日（不勾選＝永不過期）"
                  color="primary"
                  density="compact"
                  hide-details
                  class="mb-1"
                />
                <v-date-input
                  v-if="setExpiry"
                  v-model="expireAt"
                  label="到期日"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon=""
                  prepend-inner-icon="$calendar"
                  class="mb-2"
                  hide-details
                />
              </template>
            </v-form>

            <div class="d-flex justify-end mt-2">
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="save"
                :loading="submitting"
                :disabled="!canSubmit"
                @click="submitAdjust"
              >
                確認{{ Number(amount) < 0 ? '扣款' : '加款' }}
              </v-btn>
            </div>
          </template>
        </v-card>

        <v-card v-if="selectedAccount" border flat class="pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-3">調整歷史紀錄</div>
          <v-data-table
            :headers="historyHeaders"
            :items="history"
            :loading="historyLoading"
            density="comfortable"
            no-data-text="尚無調整紀錄"
          >
            <template #item.createdAt="{ item }">{{ formatDateTime(item.createdAt) }}</template>
            <template #item.amount="{ item }">
              <span
                :class="item.amount < 0 ? 'text-red-darken-2' : 'text-green-darken-2'"
                class="font-weight-bold"
              >
                {{ item.amount > 0 ? '+' : '' }}{{ formatNumber(item.amount) }}
              </span>
            </template>
            <template #item.note="{ item }">{{ item.note || '—' }}</template>
            <template #item.createdByName="{ item }">{{ item.createdByName || '—' }}</template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import dayjs from 'dayjs'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { useDebouncedAsync } from '@/utils/debounce'

const dialog = useDialogStore()

const search = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searched = ref(false)

const selectedAccount = ref(null)
const currentBalance = ref(0)

const amount = ref(null)
const note = ref('')
const setExpiry = ref(false)
const expireAt = ref(null)
const submitting = ref(false)

const history = ref([])
const historyLoading = ref(false)

const adjustForm = ref(null)

// 清空欄位並清除驗證錯誤狀態
async function resetAdjustForm() {
  amount.value = null
  note.value = ''
  setExpiry.value = false
  expireAt.value = null
  await nextTick()
  adjustForm.value?.resetValidation()
}

const historyHeaders = [
  { title: '時間', key: 'createdAt' },
  { title: '數量', key: 'amount', align: 'end' },
  { title: '原因', key: 'note' },
  { title: '操作人', key: 'createdByName' },
]

function formatNumber(v) {
  const n = Number(v || 0)
  return n.toLocaleString('zh-TW')
}

function formatDateTime(v) {
  if (!v) return '—'
  return dayjs(v).format('YYYY/MM/DD HH:mm')
}

function amountRule(v) {
  if (v === '' || v === null || v === undefined) return '請輸入數量'
  if (!Number.isInteger(Number(v))) return '請輸入整數'
  if (Number(v) === 0) return '數量不可為 0'
  return true
}

const canSubmit = computed(() => {
  return (
    selectedAccount.value &&
    Number.isInteger(Number(amount.value)) &&
    Number(amount.value) !== 0 &&
    !!(note.value && note.value.trim())
  )
})

const doSearch = useDebouncedAsync(async (keyword) => {
  const { data } = await api.get('/Token/search-accounts', { params: { keyword } })
  return data
}, 350)

async function onSearchInput(val) {
  const kw = (val || '').trim()
  if (!kw) {
    searchResults.value = []
    searched.value = false
    return
  }
  searchLoading.value = true
  try {
    searchResults.value = await doSearch(kw)
    searched.value = true
  } catch (err) {
    dialog.showAxiosError(err, '搜尋失敗')
  } finally {
    searchLoading.value = false
  }
}

function clearSearch() {
  searchResults.value = []
  searched.value = false
}

async function selectAccount(acc) {
  selectedAccount.value = acc
  currentBalance.value = acc.balance
  await resetAdjustForm()
  await loadHistory()
}

async function loadHistory() {
  if (!selectedAccount.value) return
  historyLoading.value = true
  try {
    const { data } = await api.get('/Token/adjust-history', {
      params: { guid: selectedAccount.value.accountGuid },
    })
    history.value = data || []
  } catch (err) {
    dialog.showAxiosError(err, '讀取歷史紀錄失敗')
  } finally {
    historyLoading.value = false
  }
}

async function submitAdjust() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const payload = {
      accountGuid: selectedAccount.value.accountGuid,
      amount: Number(amount.value),
      note: note.value.trim(),
      expireAt:
        Number(amount.value) > 0 && setExpiry.value && expireAt.value ? expireAt.value : null,
    }
    const { data } = await api.post('/Token/manual-adjust', payload)
    currentBalance.value = data.balance
    selectedAccount.value.balance = data.balance
    dialog.showSuccess('調整成功', `目前飼料餘額：${formatNumber(data.balance)}`)
    await resetAdjustForm()
    await loadHistory()
  } catch (err) {
    dialog.showAxiosError(err, '調整失敗')
  } finally {
    submitting.value = false
  }
}
</script>
