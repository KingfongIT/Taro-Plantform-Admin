<template>
  <div>
    <v-card>
      <v-card-title></v-card-title>
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        loading-text="資料載入中..."
        item-value="name"
        @update:options="loadItems"
      >
        <template #item.paymentStatus="{ item }">
          <span>{{ item.paymentStatus ? '已付款' : '未付款' }}</span>
        </template>
        <template #item.orderNo="{ item }">
          <v-btn color="primary" variant="text" @click="goToOrderDetail(item.salesOrderId)">
            <span>{{ item.orderNo }}</span></v-btn
          >
        </template>
        <template #no-data>
          <div class="text-center pa-6">
            <img src="/images/NoSearch.svg" />
            <h6 class="mt-2">搜尋無結果</h6>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>
<script setup>
import router from '@/router'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

//抓取params的帳號Guid
const route = useRoute()
const guid = route.params.id

const order = ref([])

const itemsPerPage = ref(50)
const headers = ref([
  { title: '訂單編號', key: 'orderNo', sortable: false },
  { title: '商品名稱', key: 'productName', sortable: false },
  { title: '金額', key: 'amount', sortable: false },
  { title: '購買會員', key: 'buyerName', sortable: false },
  { title: '推薦人', key: 'referrerName', sortable: false },
  { title: '建立日期', key: 'created', sortable: false },
  { title: 'UFYC', key: 'totalRevenueAllocationBonus', align: 'end', sortable: false },
])
const search = ref('')
const serverItems = ref([])
const loading = ref(true)
const totalItems = ref(0)
async function loadItems({ page, itemsPerPage, sortBy }) {
  loading.value = true
  try {
    const { data } = await axios.get(
      `${import.meta.env.VITE_ANOTHER_API_URL}/api/SalesOrder/order/by-referrer/${guid}`,
      {
        params: {
          page: page,
          pageSize: itemsPerPage,
          //   如果後端有支援排序可以一起丟
          //   sortKey: sortBy[0]?.key,
          //   sortOrder: sortBy[0]?.order,
        },
      },
    )
    console.log(data)
    serverItems.value = data.items // 表格資料
    totalItems.value = data.totalCount // 總筆數（很重要）
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

function goToOrderDetail(id) {
  const routeData = router.resolve({
    name: 'OrderDetail',
    params: { id },
  })

  window.open(routeData.href, '_blank')
}
</script>
