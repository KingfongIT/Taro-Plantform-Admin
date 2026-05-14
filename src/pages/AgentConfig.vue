<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>代理人</h2>
    </div>
    <v-row>
      <v-col>
        <v-card border>
          <DataTableComponent
            :title="title"
            :headers="headers"
            :item-key="itemKey"
            :items="items"
            :total-count="totalCount"
            :options="options"
            :loading="loading"
            @update:options="onOptionsUpdate"
          >
            <template v-slot:select_Slot>
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

            <template #item.detail="{ item }">
              <v-btn color="primary" variant="flat" @click="goToDetail(item.accountGuid)"
                >詳情</v-btn
              >
            </template>
          </DataTableComponent>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import DataTableComponent from '@/components/DataTableComponent.vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { debounce } from 'lodash'
import { useRouter } from 'vue-router'

const router = useRouter()
const dialog = useDialogStore()

//標題
const title = '位階設定'

//標題列
const headers = [
  { title: '名稱', key: 'name' },
  { title: '申請位階', key: 'applyGrade' },
  { title: '目前位階', key: 'positionGrade' },
  // { title: "位階狀態", key: "gradeState" },
  // { title: "未發放雞肉飼料", key: "noPayChicken" },
  // { title: "歷年累積雞肉飼料", key: "accumulateChicken" },
  // { title: "證件狀態", key: "idCardState" },
  // { title: "適用優惠", key: "specialDiscount" }, // ✅ 新增操作欄
  // { title: "合約日期", key: "contractDate" }, // ✅ 新增操作欄
  { title: '', key: 'detail', sortable: false },
]

//資料的Key值
const itemKey = 'igd'

//select篩選選項
const selectedStatus = ref(0)
const selectOptions = [
  { title: '全部', value: 0 },
  { title: '創業中心', value: 1 },
  { title: '一級代理商', value: 2 },
  { title: '二級代理商', value: 3 },
  { title: '介紹人', value: 4 },
  { title: '推廣中心', value: 5 },
]

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
  itemsPerPage: 10,
  sortBy: [],
  search: '',
})

//搜尋關鍵字
const search = ref('')
const searchLabel = ref('搜尋名稱或Eamil')

//防抖效果，延遲500ms執行
const debouncedFetch = debounce(fetchData, 500)

// 當搜尋輸入改變時重新查詢
watch(search, (val) => {
  debouncedFetch()
})

const itemsList = ref([])
const totalCount = ref(0)

//抓取資料
async function fetchData() {
  console.log('📡 fetchData 被呼叫')
  //   dialog.showLoading()

  //   try {
  //     const sort = options.value.sortBy?.[0] || {}
  //     const sortBy = sort.key || ''
  //     const sortDesc = sort.order === 'desc'
  //     const res = await api.get('/PayGradeContract/GetAllAsync', {
  //       params: {
  //         page: options.value.page,
  //         pageSize: options.value.itemsPerPage,
  //         sortBy,
  //         sortDesc,
  //         searchkeyword: search.value || '',
  //         status: selectedStatus.value,
  //       },
  //     })
  //     console.log(res.data)
  //     itemsList.value = res.data.items
  //     totalCount.value = res.data.totalCount
  //   } catch (error) {
  //     console.log(error)
  //   } finally {
  //     dialog.hideLoading()
  //   }
}

//跳轉詳情頁
function goToDetail(guid) {
  router.push({ name: 'AgentInfo', params: { id: guid } })
}
</script>
