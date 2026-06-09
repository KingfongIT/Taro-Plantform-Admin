<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>非小芋頭雞肉飼料發佣</h2>
      <v-stepper v-model="step" class="bg-secondary">
        <v-stepper-header>
          <v-stepper-item color="primary" title="選擇結算月份" :value="1"></v-stepper-item>

          <v-divider></v-divider>

          <v-stepper-item
            color="primary"
            title="確認結算結果"
            subtitle="核對結算結果是否正確"
            :value="2"
          ></v-stepper-item>
          <v-divider></v-divider>

          <v-stepper-item
            color="primary"
            title="關帳"
            subtitle="關帳後，該月份案件將鎖定不得再修改"
            :value="3"
          ></v-stepper-item>
        </v-stepper-header>
      </v-stepper>
    </div>
    <v-row>
      <v-col>
        <v-card border>
          <v-card-title>
            <div class="d-flex align-center ga-3">
              <p>選擇月份</p>
              <input
                ref="monthInput"
                type="month"
                v-model="yearMonth"
                :max="maxMonth"
                class="px-2 border rounded"
              />

              <v-switch
                v-if="loaded"
                v-model="isClosed"
                label="關帳"
                color="primary"
                :disabled="isClosed"
                @update:model-value="toggleClose"
                hide-details
              />
              <v-spacer></v-spacer>
              <v-text-field v-model="search" placeholder="搜尋姓名" hide-details></v-text-field>
            </div>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-title v-if="loaded && isClosed" class="d-flex align-center ga-3">
            <h5>報表</h5>
            <v-btn
              color="primary"
              variant="text"
              prepend-icon="download"
              @click="exportCommissionRate"
              >發佣比例表</v-btn
            >
            <v-btn color="primary" variant="text" prepend-icon="download" @click="exportSummary"
              >案件薪資總表</v-btn
            >
            <v-btn
              color="primary"
              variant="text"
              prepend-icon="download"
              @click="exportProductProfit"
              >商品收入總表</v-btn
            >
          </v-card-title>
          <v-divider></v-divider>
          <v-data-table
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="rawData"
            :items-length="rawData.length"
            :loading="loading"
            :search="search"
            item-value="name"
          >
            <template #item.name="{ item }">
              <v-btn color="primary" variant="text" @click="goToAgentDetail(item.accountGuid)">{{
                item.name
              }}</v-btn>
            </template>
            <template #item.detail="{ item }">
              <v-btn color="primary" @click="downloadDetail(item.accountGuid)">下載明細</v-btn>
            </template>
            <template #no-data>
              <div class="text-center pa-6">
                <img src="/images/NoSearch.svg" />
                <h6 class="mt-2">搜尋無結果</h6>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import api from '@/plugins/api'
import router from '@/router'
import { useDialogStore } from '@/stores/dialog'
import { ref, watch, computed } from 'vue'

const dialog = useDialogStore()

/* 步驟 step */
const step = ref(1)

const rawData = ref([])
const itemsPerPage = ref(50)
const loaded = ref(false)
const headers = ref([
  { title: '姓名', key: 'name' },
  { title: '分潤金額', key: 'amount' },
  { title: '稅額', key: 'tax' },
  { title: '健保補充保費', key: 'supplement' },
  { title: '實發金額', key: 'netAmount' },
])

const search = ref('')
const yearMonth = ref('')

const maxMonth = computed(() => {
  const now = new Date()

  // 上個月
  const year = now.getFullYear()
  const month = now.getMonth() // 這裡不用 +1，因為要上個月

  const lastMonthDate = new Date(year, month, 1)

  return lastMonthDate.toISOString().slice(0, 7)
})

const loading = ref(false)
const totalItems = ref(0)
const isClosed = ref(false)

async function fetchData() {
  loading.value = true
  loaded.value = false
  try {
    const { data } = await api.get(`/Commission/getConsultantLectureBonus`, {
      params: { YearMonth: yearMonth.value },
    })
    console.log(data)
    rawData.value = data
    totalItems.value = data.length

    //關帳狀態
    isClosed.value = data.status?.isClosed ?? false

    // ⭐ 關鍵：這裡決定 step
    if (isClosed.value) {
      step.value = 3
    } else {
      step.value = 2
    }

    return true
  } catch (error) {
    loaded.value = false
    dialog.showAxiosError(error, '取得結算資料失敗')
  } finally {
    loading.value = false
    loaded.value = true
  }
}

async function toggleClose(val) {
  if (!yearMonth.value) {
    dialog.showError('請選擇月份')
    return
  }

  if (!val) return

  const ok = await dialog.askConfirm({
    title: '要關帳嗎?',
    message: `
關帳後資料將鎖定且不可修改。<br/>若需修正，請於下期進行補發或沖銷。
`,
    isDelete: true,
  })

  if (!ok) {
    isClosed.value = false
    return
  }

  loading.value = true
  // try {
  //   await api.post(`/Commission/close`, {
  //     YearMonth: yearMonth.value,
  //   })

  //   step.value = 4
  // } catch (error) {
  //   dialog.showError('關帳失敗', error.response.data)
  //   isClosed.value = false
  // } finally {
  //   loading.value = false
  // }
}

//輸出excel
async function exportDetail() {
  try {
    dialog.showLoading()
    const res = await api.get('/Commission/exportTokenDetail', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))

    const link = document.createElement('a')
    link.href = url
    link.download = `雞肉飼料明細報表_${yearMonth.value}.xlsx`
    link.click()
  } catch (error) {
    dialog.showError('匯出失敗', error.response.data)
  } finally {
    dialog.hideLoading()
  }
}

async function exportSummary() {
  try {
    dialog.showLoading()
    const res = await api.get('/Commission/exportTokenSummary', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))

    const link = document.createElement('a')
    link.href = url
    link.download = `案件總表_${yearMonth.value}.xlsx`
    link.click()
  } catch (error) {
    dialog.showError('匯出失敗', error.response.data)
  } finally {
    dialog.hideLoading()
  }
}

async function exportCommissionRate() {
  try {
    dialog.showLoading()
    const res = await api.get('/Commission/exportCommissionRate', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))

    const link = document.createElement('a')
    link.href = url
    link.download = `${yearMonth.value}-結算比例表.xlsx`
    link.click()
  } catch (error) {
    dialog.showError('匯出失敗', error.response.data)
  } finally {
    dialog.hideLoading()
  }
}

async function exportProductProfit() {
  try {
    dialog.showLoading()
    const res = await api.get('/Commission/exportProductProfit', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))

    const link = document.createElement('a')
    link.href = url
    link.download = `${yearMonth.value}-商品收入總表.xlsx`
    link.click()
  } catch (error) {
    dialog.showError('匯出失敗', error.response.data)
  } finally {
    dialog.hideLoading()
  }
}

async function downloadDetail(guid) {
  try {
    dialog.showLoading()
    const { data } = await api.get(`/Commission/${guid}`, {
      params: { yearMonth: yearMonth.value },
    })

    // const url = window.URL.createObjectURL(new Blob([res.data]))

    // const link = document.createElement('a')
    // link.href = url
    // link.download = `雞肉飼料明細報表_${yearMonth.value}.xlsx`
    // link.click()
    console.log(data.commissions)
  } catch (error) {
    dialog.showError('匯出失敗', error.response.data)
  } finally {
    dialog.hideLoading()
  }
}

function goToAgentDetail(id) {
  const route = router.resolve({
    name: 'AgentDetail',
    params: { id },
  })

  window.open(route.href, '_blank')
}

// 使用者「切換月份」時自動 reset
watch(yearMonth, async (val) => {
  if (!val) return

  step.value = 2 // 可選：表示「正在處理」

  await fetchData()
})
</script>
