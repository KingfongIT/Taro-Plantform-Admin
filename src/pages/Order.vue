<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>訂單案件</h2>
    </div>
    <v-card border>
      <v-tabs v-model="isValid" color="primary" grow @update:model-value="onTabChange">
        <v-tab :value="true">全部訂單</v-tab>
        <v-tab :value="false">取消訂單</v-tab>
      </v-tabs>
      <v-card-title>
        <v-row>
          <v-col class="d-flex align-center">
            <h3 class="mr-4">全部</h3>
            <v-date-input
              v-model="dateRange"
              class="mr-2"
              density="compact"
              label="訂單日期區間"
              prepend-icon=""
              prepend-inner-icon="$calendar"
              max-width="368"
              multiple="range"
              hide-details
              clearable
            ></v-date-input>
            <v-select
              v-model="selectedPaymentStatus"
              :items="paymentStatusOptions"
              density="compact"
              width="120"
              label="付款狀態篩選"
              chips
              multiple
              hide-details
              clearable
            ></v-select>
            <v-spacer></v-spacer>
            <!-- <v-btn
              v-if="authStore.hasPermission('ORDER_CASE_EDIT')"
              class="mr-2"
              prepend-icon="add"
              variant="flat"
              color="primary"  
              >新增</v-btn
            > -->
            <!-- <v-btn
              v-if="authStore.hasPermission('ORDER_CASE_EDIT')"
              variant="flat"
              color="secondary"
              >匯出</v-btn
            > -->
            <v-text-field
              class="ml-4"
              v-model="search"
              prepend-inner-icon="search"
              placeholder="搜尋訂單編號、姓名、商品"
              hide-details
              density="compact"
              min-width="250"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        item-value="name"
        @update:options="loadItems"
        @click:row="(_, { item }) => goToDetail(item.salesOrderId)"
        hover
        style="cursor: pointer"
      >
        <template #item.orderStatus="{ item }">
          <v-chip v-bind="formatOrderStatus(item.orderStatus)">
            {{ formatOrderStatus(item.orderStatus).text }}
          </v-chip>
        </template>
        <template #item.paymentStatus="{ item }">
          <v-chip
            :variant="getpayStateVariant(item.paymentStatus)"
            :color="getpayStateColor(item.paymentStatus)"
          >
            {{ getpayStateWorld(item.paymentStatus) }}
          </v-chip>
        </template>
        <template #item.isEndCase="{ item }">
          <div @click.stop>
            <v-checkbox
              color="primary"
              v-model="item.isEndCase"
              hide-details
              @update:modelValue="onToggleEndCase(item.salesOrderId, item.isEndCase)"
            ></v-checkbox>
          </div>
        </template>
        <template #no-data>
          <div class="text-center pa-6">
            <img src="/images/NoSearch.svg" />
            <h6 class="mt-2">搜尋無結果</h6>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import { reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import router from '@/router'
import { useDialogStore } from '@/stores/dialog'
import { useAuthStore } from '@/stores/auth'

function checks() {
  console.log(dateRange.value[0], dateRange.value[dateRange.value.length - 1])
  //   console.log(selectedPaymentStatus.value)
}

/* ------ 身分認證 ----------- */
const authStore = useAuthStore()

const dialog = useDialogStore()

/*----- orderStatus的v-chip顏色 -----*/
function formatOrderStatus(status) {
  if (status === 'COMPLETED') {
    return { text: '已審核', color: 'primary', variant: 'tonal' }
  }
  if (status === 'CANCELLED') {
    return { text: '已取消', color: 'error', variant: 'tonal' }
  }
  return { text: '未審核', color: '', variant: 'text' }
}

/*----- payState的v-chip顏色 -----*/
function getpayStateColor(state) {
  if (state == 'PAID') {
    return 'success'
  } else if (state == 'FAILED') {
    return 'error'
  } else if (state == 'UNPAID') {
    return 'primary'
  }
}

function getpayStateVariant(state) {
  if (state == 'UNPAID') {
    return 'text'
  }
}

function getpayStateWorld(state) {
  if (state == 'PAID') {
    return '已付款'
  } else if (state == 'FAILED') {
    return '付款異常'
  } else if (state == 'UNPAID') {
    return '待付款'
  } else if (state == 'REFUNDED') {
    return '已退款'
  } else {
    return '退款中'
  }
}

const paymentStatusOptions = ref([
  { title: '待付款', value: 'UNPAID' },
  { title: '已付款', value: 'PAID' },
  { title: '付款異常', value: 'FAILED' },
  { title: '退款中', value: 'REFUNDING' },
  { title: '已退款', value: 'REFUNDED' },
])

function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD')
}

const isValid = ref(true)
const dateRange = ref()
const selectedPaymentStatus = ref([])
const headers = ref([
  {
    title: '訂單日期',
    align: 'start',
    sortable: false,
    key: 'createdAt',
    value: (item) => formatDate(item.createdAt),
  },
  { title: '狀態', key: 'orderStatus', align: 'end' },
  { title: '訂單編號', key: 'orderNo' },
  { title: '商品', key: 'detail.productName' },
  { title: '訂單姓名', key: 'buyerName' },
  { title: '訂單金額', key: 'totalAmount' },
  {
    title: '付款狀態',
    key: 'paymentStatus',
    align: 'end',
  },
  {
    title: '付款日期',
    key: 'payment.paidAt',
    align: 'end',
    value: (item) => formatDate(item.payment?.paidAt),
  },
  {
    title: '結案',
    key: 'isEndCase',
  },
  // { title: '合約書編號', key: 'contractNum', align: 'end' },
  // { title: '是否結案', key: 'isOver', align: 'end' },
])

async function fetchData({ page, itemsPerPage, sortBy, search }) {
  loading.value = true
  try {
    const sortKey = sortBy[0]?.key
    const sortOrder = sortBy[0]?.order === 'desc'
    const range = dateRange.value ?? []
    const fromDate = range[0] ?? null
    const endDate = range.length > 0 ? range[range.length - 1] : null

    const { data } = await api.get(`/Order`, {
      params: {
        page: page,
        pageSize: itemsPerPage,
        sortBy: sortKey,
        sortDesc: sortOrder,
        searchKeyword: search,
        selectOptions: selectedPaymentStatus.value,
        startDate: fromDate,
        endDate: endDate,
        isValid: isValid.value,
      },
    })
    console.log(data)

    serverItems.value = data.orders
    totalItems.value = data.totalCount
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    loading.value = false
  }
}

const itemsPerPage = ref(50)
const search = ref('')
const serverItems = ref([])
const loading = ref(false)
const totalItems = ref(0)

const options = ref({
  page: 1,
  itemsPerPage: 50,
  sortBy: [],
  search: '',
})

async function loadItems({ page, itemsPerPage, sortBy, search }) {
  options.value = { page, itemsPerPage, sortBy, search }
  await fetchData(options.value)
}

watch(selectedPaymentStatus, (newVal) => {
  fetchData({ ...options.value, page: 1 })
})

watch(dateRange, (newVal) => {
  fetchData({ ...options.value, page: 1 })
})

watch(isValid, (newVal) => {
  fetchData({ ...options.value, page: 1 })
})

/* -------- 切換 Tab -------- */
function onTabChange() {}

/* -------- 跳轉詳情頁 -------- */
function goToDetail(id) {
  const routeData = router.resolve({
    name: 'OrderDetail',
    params: { id },
  })

  window.open(routeData.href, '_blank')
}

function goToMemberDetail(guid) {
  const routeData = router.resolve({
    name: 'MembersDetail',
    params: { guid },
  })

  window.open(routeData.href, '_blank')
}

/* 結案切換 */
async function onToggleEndCase(id, nextValue) {
  console.log(id, nextValue)
  const prev = !nextValue

  dialog.showLoading()

  try {
    const { data } = await api.patch(`/Order/ToggleIsEndCase/${id}`, {
      isEndCase: nextValue,
    })
    console.log(data)
  } catch (err) {
    dialog.showAxiosError(err, '結案切換失敗')
    item.isEndCase = prev
  } finally {
    dialog.hideLoading()
  }
}
</script>

<style scoped>
.v-data-table :deep(table thead) {
  background-color: #f5f5f5;
  color: #333;
}
</style>
