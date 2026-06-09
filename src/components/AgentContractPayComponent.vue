<template>
  <v-card>
    <DataTableComponent
      :title="title"
      :headers="headers"
      :item-key="itemKey"
      :items="items"
      :total-count="totalCount"
      :options="options"
      @update:options="onOptionsUpdate"
    >
      <!-- slot:搜尋欄 -->
      <template v-slot:search_Slot>
        <v-text-field
          click:prependInner
          prepend-inner-icon="search"
          v-model="search"
          :label="searchLabel"
          single-line
          density="compact"
          hide-details
          style="max-width: 250px"
        />
      </template>

      <!-- slot: 篩選欄 -->
      <template #select_Slot>
        <v-select
          v-model="selectedStatus"
          :items="selectOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
        />
      </template>

      <!-- slot: 詳情按鈕 -->
      <template #item.actions="{ item }">
        <v-btn color="primary" variant="flat" @click="openDetail(item.contractProfiles[0].id)"
          >詳情</v-btn
        >
      </template>
    </DataTableComponent>
  </v-card>
</template>
<script setup>
import { ref, watch } from 'vue'
import DataTableComponent from './DataTableComponent.vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { debounce } from 'lodash'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'

const props = defineProps({
  id: { type: String, required: true },
})

const dialog = useDialogStore()
const route = useRoute()

//抓取params的帳號Guid
const guid = route.params.id

//標題
const title = ''

//標題列
const headers = [
  { title: '合約名稱', key: '' },
  { title: '扣款日期', key: 'contractProfiles[0].idNumber' },
  { title: '應繳費用', key: 'tokenAmountDue' },
  { title: '繳費狀態', key: 'isPaid' },
]

//日期樣式
function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

// 📌 搜尋與篩選
const search = ref('')
const searchLabel = ref('搜尋名稱')

const selectedStatus = ref(0)
const selectOptions = [
  { title: '全部', value: 0 },
  { title: '已繳費', value: 1 },
  { title: '未繳費', value: 2 },
]

//資料的Key值
const itemKey = 'id'

//當篩選變動時回傳
function onOptionsUpdate(val) {
  options.value = val
  fetchData()
}

// 當篩選改變時重新抓資料
watch(selectedStatus, (val) => {
  fetchData()
})

// 分頁 + 排序狀態
const options = ref({
  page: 1,
  itemsPerPage: 50,
  sortBy: [],
  search: '',
})

//防抖效果，延遲500ms執行
const debouncedFetch = debounce(fetchData, 500)

// 當搜尋輸入改變時重新查詢
watch(search, (val) => {
  debouncedFetch()
})

const items = ref([])
const totalCount = ref(0)

//抓取資料
async function fetchData() {
  dialog.showLoading()

  try {
    const sort = options.value.sortBy?.[0] || {}
    const sortBy = sort.key || ''
    const sortDesc = sort.order === 'desc'
    const res = await api.get('/Agent/GetAllBillAsync', {
      params: {
        page: options.value.page,
        pageSize: options.value.itemsPerPage,
        sortBy,
        sortDesc,
        searchkeyword: search.value || '',
        status: selectedStatus.value,
        guid: guid,
      },
    })
 
    items.value = res.data.items
    totalCount.value = res.data.totalCount
  } catch (error) {
    console.log(error)
  } finally {
    dialog.hideLoading()
  }
}
</script>
