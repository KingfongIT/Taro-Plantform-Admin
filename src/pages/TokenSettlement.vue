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
            <v-btn
              prepend-icon="download"
              color="primary"
              variant="outlined"
              @click="exportTempSummary"
              >500以上雞肉飼料佣金總表</v-btn
            >
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
            <v-btn color="primary" variant="flat" @click="updateToken">更新小芋頭雞肉飼料</v-btn>
          </v-stepper-item>

          <v-divider></v-divider>
          <v-stepper-item color="primary" :value="4">
            <template #title>
              <div class="text-start">匯出歷史資料</div>
            </template>

            <template #subtitle>
              <div class="mb-1">下載歷史資料</div>
            </template>
            <v-btn color="primary" variant="outlined" @click="open500upDialog" class="mr-2"
              >總表</v-btn
            >
            <v-btn color="primary" variant="outlined" @click="openIndividualDialog"
              >個人佣金表</v-btn
            >
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
              <v-text-field
                v-model.lazy.trim="search"
                placeholder="搜尋姓名、身分證、信箱"
                hide-details
              ></v-text-field>
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
          <input
            v-if="mode500up === 'custom'"
            ref="monthInput"
            type="month"
            v-model="yearMonth500up"
            :max="maxMonth"
            class="ma-3 pa-2 border rounded"
          />
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
          <input
            v-if="modeDividual === 'custom'"
            ref="monthInput"
            type="month"
            v-model="yearMonthDividual"
            :max="maxMonth"
            class="ma-3 pa-2 border rounded"
          />
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

/* dialog */
const token500upDialog = ref(false)
const individualDialog = ref(false)

const mode500up = ref('current')
const yearMonth500up = ref('')

const modeDividual = ref('current')
const yearMonthDividual = ref('')

const maxMonth = computed(() => {
  const now = new Date()

  // 上個月
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 這裡不用 +1，因為要上個月

  const lastMonthDate = new Date(year, month, 1)

  return lastMonthDate.toISOString().slice(0, 7)
})

function open500upDialog() {
  token500upDialog.value = true
}

function openIndividualDialog() {
  individualDialog.value = true
}

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
    const { data } = await api.post(`/Settle`)
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

<style scoped></style>
