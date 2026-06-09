<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>小芋頭雞肉飼料佣金發放</h2>

      <v-stepper v-model="step" class="bg-secondary" non-linear>
        <v-stepper-header>
          <v-stepper-item color="primary" :value="1">
            <template #title>
              <div class="text-start">案件結算</div>
            </template>
            <template #subtitle>
              <div>執行每月案件結算作業</div>
            </template>
          </v-stepper-item>

          <v-divider></v-divider>

          <v-stepper-item color="primary" :value="2">
            <template #title>
              <div class="text-start">下載500以上雞肉飼料薪資總表</div>
            </template>

            <template #subtitle>
              <div class="mb-1">下載報表並執行行政發佣作業</div>
            </template>
            <v-btn prepend-icon="download" color="primary" variant="outlined"
              @click="exportTempSummary">500以上雞肉飼料佣金總表</v-btn>
          </v-stepper-item>

          <v-divider></v-divider>

          <v-stepper-item color="primary" :value="3">
            <template #title>
              <div class="text-start">完成行政發佣作業</div>
            </template>

            <template #subtitle>
              <div>銀行匯款</div>
            </template>
          </v-stepper-item>
          <v-divider></v-divider>

          <v-stepper-item color="primary" :value="4">
            <template #title>
              <div class="text-start">更新飼料</div>
            </template>

            <template #subtitle>
              <div class="mb-1">確認佣金發放完成後，進行小芋頭雞肉飼料更新</div>
            </template>
            <div class="d-flex flex-column align-start mt-0">
              <v-checkbox v-model="isManual" label="手動發放 (不使用玉山 API)" hide-details density="compact" color="primary"
                class="ma-0 pa-0 compact-checkbox"></v-checkbox>
              <v-btn variant="flat" color="primary" :loading="loading" @click="updateToken"
                class="mt-1">更新小芋頭雞肉飼料</v-btn>
            </div>
          </v-stepper-item>

          <v-divider></v-divider>
          <v-stepper-item color="primary" :value="4">
            <template #title>
              <div class="text-start">匯出歷史資料</div>
            </template>

            <template #subtitle>
              <div class="mb-1">下載歷史資料</div>
            </template>
            <v-btn color="primary" variant="outlined" @click="open500upDialog" class="mr-2">總表</v-btn>
            <v-btn color="primary" variant="outlined" @click="openIndividualDialog">個人佣金表</v-btn>
          </v-stepper-item>
        </v-stepper-header>
      </v-stepper>
    </div>

    <v-row>
      <v-col>
        <v-card border>
          <v-card-title>
            <div class="d-flex align-center ga-3">
              <p>佣金發放</p>
              <v-spacer></v-spacer>
              <v-text-field v-model.lazy.trim="search" placeholder="搜尋姓名、身分證、信箱" hide-details></v-text-field>
              <v-btn variant="flat" color="error" @click="testDelete"> 測試刪除用 </v-btn>
            </div>
          </v-card-title>
          <v-divider></v-divider>

          <v-tabs v-model="tab" color="primary">
            <v-tab value="token500up">飼料500以上</v-tab>
            <v-tab value="token500upUnDataConfirmed">飼料500以上未審核</v-tab>
            <v-tab value="token500down">飼料500以下</v-tab>
          </v-tabs>

          <v-divider></v-divider>
          <v-window v-model="tab">
            <v-window-item value="token500up">
              <Token500up ref="token500upRef" :search="search"></Token500up>
            </v-window-item>
            <v-window-item value="token500upUnDataConfirmed">
              <Token500upUnDataComfirmed :search="search" />
            </v-window-item>
            <v-window-item value="token500down">
              <Token500down :search="search" />
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="token500upDialog" max-width="450">
    <v-card>
      <v-card-title> 500以上雞肉飼料佣金總表 </v-card-title>
      <v-card-text>
        <v-radio-group v-model="mode500up">
          <v-radio label="當月" value="current" />
          <v-radio label="選擇月份" value="custom" />
          <div v-if="mode500up === 'custom'" class="ma-3">
            <v-menu
              v-model="monthMenu500up"
              :close-on-content-click="false"
              location="bottom start"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-model="yearMonth500up"
                  label="選擇月份"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  prepend-inner-icon="calendar_today"
                  color="primary"
                  v-bind="props"
                  class="cursor-pointer"
                  style="cursor: pointer;"
                ></v-text-field>
              </template>

              <v-card width="290" class="pa-3" border flat elevation="3">
                <!-- 年份選擇列 -->
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-btn
                    icon="chevron_left"
                    variant="text"
                    density="comfortable"
                    @click="pickerYear500up--"
                  ></v-btn>
                  <span class="text-subtitle-1 font-weight-bold">{{ pickerYear500up }} 年</span>
                  <v-btn
                    icon="chevron_right"
                    variant="text"
                    density="comfortable"
                    :disabled="pickerYear500up >= maxYear500up"
                    @click="pickerYear500up++"
                  ></v-btn>
                </div>

                <!-- 3x4 月份格線 -->
                <v-row class="ma-0" dense>
                  <v-col
                    v-for="(mName, idx) in monthNames"
                    :key="idx"
                    cols="4"
                    class="text-center pa-1"
                  >
                    <v-btn
                      variant="tonal"
                      :color="isSelectedMonth500up(idx) ? 'primary' : 'default'"
                      :disabled="isMonthDisabled500up(idx)"
                      block
                      size="small"
                      class="text-body-2 font-weight-bold"
                      @click="selectMonth500up(idx)"
                    >
                      {{ mName }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
          </div>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" variant="flat" @click="close500upDialog">取消</v-btn>
        <v-btn color="primary" variant="flat" @click="exportSummary">匯出</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="individualDialog" max-width="450">
    <v-card>
      <v-card-title> 個人佣金表 </v-card-title>
      <v-card-text>
        <v-radio-group v-model="modeDividual">
          <v-radio label="當月" value="current" />
          <v-radio label="選擇月份" value="custom" />
          <div v-if="modeDividual === 'custom'" class="ma-3">
            <v-menu
              v-model="monthMenuDividual"
              :close-on-content-click="false"
              location="bottom start"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-model="yearMonthDividual"
                  label="選擇月份"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  prepend-inner-icon="calendar_today"
                  color="primary"
                  v-bind="props"
                  class="cursor-pointer"
                  style="cursor: pointer;"
                ></v-text-field>
              </template>

              <v-card width="290" class="pa-3" border flat elevation="3">
                <!-- 年份選擇列 -->
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-btn
                    icon="chevron_left"
                    variant="text"
                    density="comfortable"
                    @click="pickerYearDividual--"
                  ></v-btn>
                  <span class="text-subtitle-1 font-weight-bold">{{ pickerYearDividual }} 年</span>
                  <v-btn
                    icon="chevron_right"
                    variant="text"
                    density="comfortable"
                    :disabled="pickerYearDividual >= maxYearDividual"
                    @click="pickerYearDividual++"
                  ></v-btn>
                </div>

                <!-- 3x4 月份格線 -->
                <v-row class="ma-0" dense>
                  <v-col
                    v-for="(mName, idx) in monthNames"
                    :key="idx"
                    cols="4"
                    class="text-center pa-1"
                  >
                    <v-btn
                      variant="tonal"
                      :color="isSelectedMonthDividual(idx) ? 'primary' : 'default'"
                      :disabled="isMonthDisabledDividual(idx)"
                      block
                      size="small"
                      class="text-body-2 font-weight-bold"
                      @click="selectMonthDividual(idx)"
                    >
                      {{ mName }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
          </div>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" variant="flat" @click="closeIndividualDialog">取消</v-btn>
        <v-btn color="primary" variant="flat" @click="downloadZip">匯出</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import Token500down from '@/components/Token500down.vue'
import Token500up from '@/components/Token500up.vue'
import Token500upUnDataComfirmed from '@/components/Token500upUnDataComfirmed.vue'
import api from '@/plugins/api'
import router from '@/router'
import { useDialogStore } from '@/stores/dialog'
import { ref, watch, computed } from 'vue'
import { fa } from 'vuetify/locale'

const dialog = useDialogStore()
const env_mod = import.meta.env.MODE
const isDev = env_mod == 'development' || env_mod == 'staging'
/* 步驟step */
const step = ref(1)

/* tab */
const tab = ref('token500up')

const search = ref('')

const token500upRef = ref()

const loading = ref(false)
const isClosed = ref(false)
const isManual = ref(false)

/* dialog */
const token500upDialog = ref(false)
const individualDialog = ref(false)

const mode500up = ref('current')
const yearMonth500up = ref('')

const modeDividual = ref('current')
const yearMonthDividual = ref('')

// 自訂月份選擇器狀態
const monthMenu500up = ref(false)
const pickerYear500up = ref(new Date().getFullYear())

const monthMenuDividual = ref(false)
const pickerYearDividual = ref(new Date().getFullYear())

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const maxMonth = computed(() => {
  const now = new Date()
  // 上個月
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const lastMonthDate = new Date(year, month, 1)
  return lastMonthDate.toISOString().slice(0, 7)
})

const maxYear500up = computed(() => {
  if (!maxMonth.value) return new Date().getFullYear()
  return parseInt(maxMonth.value.split('-')[0])
})
const maxMonthNum500up = computed(() => {
  if (!maxMonth.value) return new Date().getMonth() + 1
  return parseInt(maxMonth.value.split('-')[1])
})

function isMonthDisabled500up(idx) {
  const monthNum = idx + 1
  if (pickerYear500up.value > maxYear500up.value) return true
  if (pickerYear500up.value === maxYear500up.value && monthNum > maxMonthNum500up.value) return true
  return false
}

function isSelectedMonth500up(idx) {
  if (!yearMonth500up.value) return false
  const [y, m] = yearMonth500up.value.split('-')
  return parseInt(y) === pickerYear500up.value && parseInt(m) === (idx + 1)
}

function selectMonth500up(idx) {
  const monthStr = (idx + 1).toString().padStart(2, '0')
  yearMonth500up.value = `${pickerYear500up.value}-${monthStr}`
  monthMenu500up.value = false
}

const maxYearDividual = computed(() => {
  if (!maxMonth.value) return new Date().getFullYear()
  return parseInt(maxMonth.value.split('-')[0])
})
const maxMonthNumDividual = computed(() => {
  if (!maxMonth.value) return new Date().getMonth() + 1
  return parseInt(maxMonth.value.split('-')[1])
})

function isMonthDisabledDividual(idx) {
  const monthNum = idx + 1
  if (pickerYearDividual.value > maxYearDividual.value) return true
  if (pickerYearDividual.value === maxYearDividual.value && monthNum > maxMonthNumDividual.value) return true
  return false
}

function isSelectedMonthDividual(idx) {
  if (!yearMonthDividual.value) return false
  const [y, m] = yearMonthDividual.value.split('-')
  return parseInt(y) === pickerYearDividual.value && parseInt(m) === (idx + 1)
}

function selectMonthDividual(idx) {
  const monthStr = (idx + 1).toString().padStart(2, '0')
  yearMonthDividual.value = `${pickerYearDividual.value}-${monthStr}`
  monthMenuDividual.value = false
}

function open500upDialog() {
  token500upDialog.value = true
  const ym = yearMonth500up.value || getCurrentMonth()
  pickerYear500up.value = parseInt(ym.split('-')[0])
}

function openIndividualDialog() {
  individualDialog.value = true
  const ym = yearMonthDividual.value || getCurrentMonth()
  pickerYearDividual.value = parseInt(ym.split('-')[0])
}

watch(yearMonth500up, (val) => {
  if (val) {
    pickerYear500up.value = parseInt(val.split('-')[0])
  }
})

watch(yearMonthDividual, (val) => {
  if (val) {
    pickerYearDividual.value = parseInt(val.split('-')[0])
  }
})

async function updateToken() {
  const ok = await dialog.askConfirm({
    title: '確定發佣嗎?',
    message: `
    系統將進行佣金試算。    
    `,
    isDelete: true,
  })

  if (!ok) {
    isClosed.value = false
    return
  }

  try {
    loading.value = true
    const { data } = await api.post(`/Settle`, null, {
      params: { isManual: isManual.value }
    })
    console.log(data)
    token500upRef.value?.fetchData()
  } catch (error) {
    console.log(error)
    loading.value = false
    dialog.showError('更新小芋頭雞肉飼料失敗', error.response.data)
  } finally {
    loading.value = false
  }
}

// 取得當月 YYYY-MM
function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function close500upDialog() {
  token500upDialog.value = false
  mode500up.value = 'current'
  yearMonth500up.value = ''
}

function closeIndividualDialog() {
  individualDialog.value = false
  modeDividual.value = 'current'
  yearMonthDividual.value = ''
}

// 👉 匯出500以上暫存表
async function exportTempSummary() {
  try {
    dialog.showLoading()

    const response = await api.get('/Settle/exportTempSummary', {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(response.data)

    const link = document.createElement('a')
    link.href = url
    link.download = `500以上雞肉飼料佣金總表.xlsx`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.log(error)
    dialog.showError('資料抓取失敗', error)
  } finally {
    dialog.hideLoading()
  }
}

// 👉 匯出500以上佣金總表
async function exportSummary() {
  let ym

  // 判斷模式
  if (mode500up.value === 'current') {
    ym = getCurrentMonth()
  } else {
    ym = yearMonth500up.value
  }

  // 防呆
  if (!ym) {
    alert('請選擇月份')
    return
  }

  try {
    dialog.showLoading()
    console.log(ym)
    const { data } = await api.get('/Settle/exportSummary', {
      params: { yearMonth: ym },
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `${ym}_500以上雞肉飼料佣金總表.xlsx`
    link.click()
  } catch (error) {
    dialog.showError('匯出失敗', error.response.data)
  } finally {
    dialog.hideLoading()
  }
}

// 👉 匯出個人傭金表
async function downloadZip() {
  let ym

  // 判斷模式
  if (modeDividual.value === 'current') {
    ym = getCurrentMonth()
  } else {
    ym = yearMonthDividual.value
  }

  // 防呆
  if (!ym) {
    alert('請選擇月份')
    return
  }

  try {
    dialog.showLoading()
    const { data } = await api.get('/Settle/downloadZip', {
      params: { yearMonth: ym },
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `佣金單_${ym}.zip`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.log(error)
    dialog.showError('匯出失敗', error)
  } finally {
    dialog.hideLoading()
  }
}

//刪除測試用
async function testDelete() {
  try {
    dialog.showLoading()
    await api.delete('/Settle/testDelete')
  } catch (error) {
    dialog.showError('刪除失敗', error.response.data)
  } finally {
    dialog.hideLoading()
  }
}

watch(tab, () => {
  search.value = '' // 切換 tab 時清空搜尋
})
</script>

<style scoped>
:deep(.compact-checkbox .v-selection-control) {
  min-height: 28px !important;
}

:deep(.compact-checkbox .v-label) {
  height: 28px !important;
  line-height: 28px !important;
}
</style>
