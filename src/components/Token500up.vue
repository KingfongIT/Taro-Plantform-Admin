<template>
  <v-data-table
    v-model:items-per-page="itemsPerPage"
    :headers="headers"
    :items="rawData"
    :items-length="rawData.length"
    :loading="loading"
    :search="props.search"
    item-value="name"
  >
    <template #item.salesOrderId="{ item }">
      <v-btn color="primary" variant="text" @click="goToOrderDetail(item.salesOrderId)">{{
        item.salesOrderId
      }}</v-btn>
    </template>
    <template #item.name="{ item }">
      <v-btn color="primary" variant="text" @click="goToAgentDetail(item.guid)">{{
        item.name
      }}</v-btn>
    </template>
    <template #no-data>
      <div class="text-center pa-6">
        <img src="/images/NoSearch.svg" />
        <h6 class="mt-2">搜尋無結果</h6>
      </div>
    </template>
  </v-data-table>
</template>

<script setup>
import api from '@/plugins/api'
import router from '@/router'
import { useDialogStore } from '@/stores/dialog'
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  search: String,
})

defineExpose({
  fetchData,
})

const dialog = useDialogStore()

const rawData = ref([])
const itemsPerPage = ref(-1)

const headers = ref([
  { title: '姓名', key: 'name' },
  { title: '身分證', key: 'idNumber' },
  { title: '信箱', key: 'email' },
  { title: '應稅小計', key: 'balance' },
  { title: '稅額', key: 'tax' },
  { title: '健保補充費', key: 'supplementary' },
  { title: '實發金額', key: 'netAmount' },
])

const loading = ref(false)
const totalItems = ref(0)
const isClosed = ref(false)

async function fetchData() {
  loading.value = true

  try {
    const { data } = await api.get(`/Settle`, {
      params: { is500: true },
    })
    console.log(data)
    rawData.value = data
    totalItems.value = data.length

    //關帳狀態
    isClosed.value = data.status?.isClosed ?? false
  } catch (error) {
    console.log(error)

    dialog.showAxiosError(error, '取得結算資料失敗')
  } finally {
    loading.value = false
  }
}

function goToAgentDetail(id) {
  const route = router.resolve({
    name: 'AgentDetail',
    params: { id },
  })

  window.open(route.href, '_blank')
}

onMounted(() => {
  fetchData()
})
</script>
