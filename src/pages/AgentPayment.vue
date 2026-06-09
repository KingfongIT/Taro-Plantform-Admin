<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>代理人付款紀錄</h2>
    </div>

    <v-card border>
      <v-card-title>
        <div class="d-flex justify-space-between align-center">
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            label="搜尋（姓名 / Email / 訂單號）"
            density="compact"
            hide-details
            clearable
            max-width="300"
            @update:model-value="onSearchChanged"
          />
        </div>
      </v-card-title>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        item-value="transactionId"
        @update:options="loadItems"
        @click:row="(_, { item }) => goToAgentDetail(item.guid)"
        hover
        style="cursor: pointer"
      >
        <template #item.payStatus="{ item }">
          <v-chip v-bind="formatPaymentStatus(item.payStatus)">{{
            formatPaymentStatus(item.payStatus).text
          }}</v-chip>
        </template>
        <template #item.paidAt="{ item }">
          <span>{{ useDateFormat(item.paidAt, 'YYYY/MM/DD HH:mm') }}</span>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import router from '@/router'
import { useDateFormat } from '@/utils/formatDate'
import { ref } from 'vue'

const headers = [
  { title: '會員名稱', key: 'name', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: '付款金額', key: 'amount', sortable: false },
  { title: '付款日期', key: 'paidAt', sortable: false },
  { title: '付款狀態', key: 'payStatus', sortable: false },
  //   { title: '訂單號', key: 'orderNo', sortable: false },
  { title: '藍星訂單號碼', key: 'newebTradeNo', sortable: false },
  { title: '備註', key: 'itemName', sortable: false },
]

const serverItems = ref([])
const totalItems = ref(0)
const itemsPerPage = ref(50)
const search = ref('')
const loading = ref(false)

let searchDebounceTimer = null

function onSearchChanged() {
  // 避免每打一個字就打 API
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    // 觸發 v-data-table-server 重新載入
    // 最簡單方式：直接呼叫 loadItems，並強制 page 回 1
    loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
  }, 300)
}

async function loadItems(options) {
  const { page, itemsPerPage, sortBy } = options

  const sortKey = sortBy?.[0]?.key
  const sortDesc = sortBy?.[0]?.order === 'desc'

  loading.value = true
  try {
    const { data } = await api.get(`/AgentPayment`, {
      params: {
        page: page,
        pageSize: itemsPerPage,
        sortBy: sortKey,
        sortDesc: sortDesc, // ✅ 建議傳 boolean
        searchKeyword: search.value ?? '',
      },
    })

    console.log(data)

    // 後端回傳格式建議：{ items: [], total: 123 }
    serverItems.value = data ?? []
    totalItems.value = data.length ?? 0
  } catch (err) {
    console.error('資料抓取失敗', err)
  } finally {
    loading.value = false
  }
}

function formatPaymentStatus(status) {
  if (status === 'SUCCESS') {
    return { text: '付款成功', color: 'success', variant: 'tonal' }
  }
  if (status === 'Pending') {
    return { text: '待付款', color: 'secondary', variant: 'text' }
  }
  return { text: '破月免費', color: 'success', variant: 'tonal' }
}

function goToAgentDetail(id) {
  // 假設有一個詳細頁面路由
  router.push({ name: 'AgentDetail', params: { id } })
}
</script>
