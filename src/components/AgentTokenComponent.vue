<template>
  <v-row align="stretch">
    <v-col>
      <v-card variant="flat" class="h-100">
        <v-card-title> 雞肉飼料 </v-card-title>
        <v-card-text>
          <div class="d-flex justify-center align-center flex-column">
            <p>雞肉飼料數</p>
            <div class="d-flex justify-center align-center">
              <h2>{{ tokenBalance }}</h2>
              <p class="ml-2">顆</p>
            </div>
          </div>
          <v-table>
            <tbody>
              <tr>
                <td>已失效</td>
                <td>{{ expiredToken }}</td>
              </tr>
              <tr>
                <td>歷史總累積　（含有效與無效）</td>
                <td>{{ historyToken }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col>
      <v-card variant="flat" class="h-100">
        <v-card-title> 當月統計 </v-card-title>
        <v-card-text>
          <div class="d-flex justify-center align-center flex-column">
            <p>雞肉飼料數</p>
            <div class="d-flex justify-center align-center">
              <h2>{{ sumTokenByMonthly }}</h2>
              <p class="ml-2">顆</p>
            </div>
          </div>
          <v-table>
            <tbody>
              <tr>
                <td>合約證件</td>
                <td :class="contractConfirmed ? 'text-success' : 'text-error'">
                  {{ contractConfirmed ? '已審核' : '未審核' }}
                </td>
              </tr>
            </tbody>
            <p>*若達門檻，佣金於每月 15 日自動發放</p>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <v-row>
    <v-col>
      <v-card variant="flat">
        <v-tabs v-model="tab" color="primary" grow>
          <v-tab :value="0">獲得紀錄</v-tab>
          <v-tab :value="1">發放紀錄</v-tab>
        </v-tabs>
        <v-data-table
          :title="title"
          :headers="tab === 0 ? earnHeaders : payoutHeaders"
          :item-key="itemKey"
          :items="tab === 0 ? earnToken : payoutToken"
          :total-count="totalCount"
          :loading="tableLoading"
          loading-text="資料載入中..."
          :options="options"
        >
          <template #item.orderNo="{ item }">
            <v-btn variant="text" color="primary" @click="goToOrderDetail(item.salesOrderId)">{{
              item.orderNo
            }}</v-btn>
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
</template>
<script setup>
import { useDialogStore } from '@/stores/dialog'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/plugins/api'
import { useDateFormat } from '@/utils/formatDate'
import router from '@/router'

const props = defineProps({
  id: { type: String, required: true },
})

const route = useRoute()
const dialog = useDialogStore()

//抓取params的帳號Guid
const guid = route.params.id

// 雞肉飼料
const tokenBalance = ref(0)
const expiredToken = ref(0)
const historyToken = ref(0)
const sumTokenByMonthly = ref()

//合約有無審核
const contractConfirmed = ref(false)

//tab
const tab = ref(0) // 0: 獲得紀錄, 1: 發放紀錄
const earnToken = ref([])
const payoutToken = ref([])

//data table
const title = '合約紀錄'

const payoutHeaders = [
  { title: '年', key: 'year' },
  { title: '月', key: 'month' },
  { title: '扣除雞肉飼料', key: 'amount' },
  { title: '稅額(-)', key: 'tax' },
  { title: '補充保費(-)', key: 'supplementary' },
  { title: '淨額收入', key: 'netAmount' },
  {
    title: '發放日期',
    key: 'createdAt',
    value: (item) => useDateFormat(item.createdAt, 'YYYY-MM-DD'),
  },
]

const earnHeaders = [
  { title: '年', key: 'year' },
  { title: '月', key: 'month' },
  { title: '訂單編號', key: 'orderNo' },
  { title: '獎金類型', key: 'bonusType' },
  { title: '商品名稱', key: 'productName' },
  {
    title: '有效日期',
    key: 'expireAt',
    value: (item) => useDateFormat(item.expireAt, 'YYYY-MM-DD'),
  },
  { title: '獲得飼料', key: 'amount' },
]

const itemKey = 'id'
const tableLoading = ref(false)
const totalCount = ref(0)
const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  sortDesc: [],
})

async function fetchData() {
  dialog.showLoading()
  await fetchToken()
  await fetchExpiredToken()
  await fetchHistoryToken()
  await fetchEarnToken()
  await fetchContractConfirmed()
  await fetchSumByMonthly()
  dialog.hideLoading()
}

async function fetchToken() {
  try {
    const { data } = await api.get(`/Token/getBalance/${guid}`)
    tokenBalance.value = data.balance
  } catch (error) {
    console.log(error)
  }
}

async function fetchExpiredToken() {
  try {
    const { data } = await api.get(`/Token/getExpired/${guid}`)
    expiredToken.value = data
  } catch (error) {
    console.log(error)
  }
}

async function fetchHistoryToken() {
  try {
    const { data } = await api.get(`/Token/getHistory/${guid}`)
    historyToken.value = data
  } catch (error) {
    console.log(error)
  }
}

async function fetchEarnToken() {
  try {
    tableLoading.value = true
    const { data } = await api.get(`/Token/getLedger/${guid}`)
    earnToken.value = data
  } catch (error) {
    console.log(error)
  } finally {
    tableLoading.value = false
  }
}

async function fetchPayoutToken() {
  try {
    tableLoading.value = true
    const { data } = await api.get(`/Token/getSettle/${guid}`)
    payoutToken.value = data
  } catch (error) {
    console.log(error)
  } finally {
    tableLoading.value = false
  }
}

async function fetchSumByMonthly() {
  try {
    const { data } = await api.get(`/Token/getSumByMonthly/${guid}`)
    sumTokenByMonthly.value = data
    console.log(data)
  } catch (error) {
    console.log(error)
  }
}

async function fetchContractConfirmed() {
  try {
    const { data } = await api.get(`/Agent/getContractConfirmed/${guid}`)
    contractConfirmed.value = data
    console.log(data)
  } catch (error) {
    console.log(error)
  }
}

function goToOrderDetail(id) {
  const routeData = router.resolve({
    name: 'OrderDetail',
    params: { id },
  })

  window.open(routeData.href, '_blank')
}

watch(tab, async (newTab) => {
  console.log(tab.value)
  if (newTab === 0) {
    await fetchEarnToken()
  } else {
    await fetchPayoutToken()
  }
})

onMounted(() => {
  fetchData()
})
</script>
