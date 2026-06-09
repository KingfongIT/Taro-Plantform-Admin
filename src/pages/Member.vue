<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>會員總覽</h2>
    </div>
    <v-row>
      <v-col cols="4"
        ><DonutChart
          :chart-title="chartTitle"
          :donut-option="{ items: DonutItems }"
          :series="chartSeries"
          :labels="chartLabels"
          :loading="chartLoading"
      /></v-col>
      <v-col cols="4"><MemberRegister :list="DonutItems"></MemberRegister> </v-col>
      <v-col cols="4"
        ><MemberRecommend :rankingData="ReferRank" @rangeChanged="onRangeChanged"></MemberRecommend
      ></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card border>
          <v-card-title class="d-flex">
            <v-select
              max-width="170"
              v-model="selectedStatus"
              :items="selectOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-spacer></v-spacer>
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
          </v-card-title>
          <v-data-table-server
            :title="title"
            :headers="headers"
            :item-key="itemKey"
            :items="items"
            :items-length="totalCount"
            :options="options"
            :showCheckBox="true"
            @update:options="onOptionsUpdate"
            @click:row="(_, { item }) => goToDetail(item.accountGuid)"
            hover
            style="cursor: pointer"
          >
            <!-- 操作按鈕 -->
            <template #item.actions="{ item }">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon="more_horiz" v-bind="props" variant="text" />
                </template>
                <v-list>
                  <v-list-item @click="editMember(item)">
                    <v-list-item-title>設定</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteMember(item)">
                    <v-list-item-title>刪除</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
            <template #no-data>
              <div class="text-center pa-6">
                <img src="/images/NoSearch.svg" />
                <h6 class="mt-2">搜尋無結果</h6>
              </div>
            </template>
          </v-data-table-server>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import DataTableComponent from '@/components/DataTableComponent.vue'
import DonutChart from '@/components/DonutChart.vue'
import MemberRegister from '@/components/MemberRegister.vue'
import MemberRecommend from '@/components/MemberRecommend.vue'
import { useDialogStore } from '@/stores/dialog'
import { ref, watch, onMounted, computed } from 'vue'
import { debounce } from 'lodash'
import api from '@/plugins/api'
import router from '@/router'

const dialog = useDialogStore()

//標題
const title = '小芋頭會員'

//標題列設定
const headers = [
  { title: '名稱', key: 'name' },
  { title: '信箱', key: 'email' },
  { title: '等級', key: 'level' },
  { title: '推薦人', key: 'reference' },
  { title: '創建日期', key: 'formattedCreatedDate', sortable: true, sortBy: 'createdDate' },
  { title: '操作', key: 'actions', sortable: false, align: 'center', width: 150 }, // ✅ 新增操作欄
]

//資料Key值
const itemKey = 'accountGuid'

//資料
const items = ref([])
const totalCount = ref(0)
const loading = ref(false)

//下拉篩選
const selectedStatus = ref(0)
const selectOptions = [
  { title: '全部', value: 0 },
  { title: '創業中心', value: 1 },
  { title: '一級代理商', value: 2 },
  { title: '二級代理商', value: 3 },
  { title: '介紹人', value: 4 },
  { title: '推廣中心', value: 5 },
]

watch(selectedStatus, async (val) => {
  dialog.showLoading()
  await fetchData()
  dialog.hideLoading()
})

// 分頁 + 排序狀態
const options = ref({
  page: 1,
  itemsPerPage: 50,
  sortBy: [],
  search: '',
})

//搜尋關鍵字
const search = ref('')
const searchLabel = ref('搜尋名稱或Eamil')

// 當搜尋輸入改變時重新查詢
watch(search, async (val) => {
  await debouncedFetch()
})

//當篩選變動時回傳
async function onOptionsUpdate(val) {
  dialog.showLoading()
  options.value = val
  await fetchData()
  dialog.hideLoading()
}

//抓取資料
async function fetchData() {
  try {
    loading.value = true
    //抓會員資料
    const sort = options.value.sortBy?.[0] || {}
    const sortBy = sort.key || ''
    const sortDesc = sort.order === 'desc'

    const res = await api.get('/Account/GetAll', {
      params: {
        page: options.value.page,
        pageSize: options.value.itemsPerPage,
        sortBy,
        sortDesc,
        searchkeyword: search.value || '',
        status: selectedStatus.value,
      },
    })

    // console.log(res.data)

    items.value = res.data.items
    totalCount.value = res.data.totalCount
  } catch (error) {
    console.error('獲取會員資料失敗:', error)
    dialog.showError('讀取失敗', '資料取得失敗，請稍後再試')
    // 清空數據避免顯示錯誤狀態s
    items.value = []
    totalCount.value = 0
  }
}
//防抖效果，延遲500ms執行
const debouncedFetch = debounce(fetchData, 500)

/* 圖表Donut Chart */
const chartTitle = ref('會員總覽')
const DonutItems = ref([])
const chartLoading = ref(false)

async function fetchRegister() {
  try {
    chartLoading.value = true
    const res = await api.get('/Account/GetRegister')
    DonutItems.value = res.data
    // console.log(DonutItems.value)
  } catch (error) {
    console.error('獲取註冊資料失敗:', error)
    dialog.showError('圖表載入失敗', '無法載入會員統計資料')
    DonutItems.value = []
  } finally {
    chartLoading.value = false
  }
}

const levelCounts = computed(() => {
  const result = {}
  DonutItems.value.forEach((member) => {
    const level = member.level ?? '一般會員'
    result[level] = (result[level] || 0) + 1
  })
  return result
})

const chartSeries = computed(() => Object.values(levelCounts.value))
const chartLabels = computed(() => Object.keys(levelCounts.value))

// 操作按鈕處理函數
const editMember = (item) => {
  console.log('編輯會員:', item)
  // TODO: 實現編輯功能
}

const deleteMember = (item) => {
  console.log('刪除會員:', item)
  // TODO: 實現刪除功能
}

// 格式化日期函數（如果需要的話）
// const formatDate = (dateString) => {
//   if (!dateString) return ''
//   return new Date(dateString).toLocaleDateString('zh-TW')
// }

/* 推薦人數Chart */
const currentRange = ref('1y')
const ReferRank = ref()
async function fetchReferRanking(range) {
  const res = await api.get('/Account/referral-ranking', {
    params: { range },
  })
  // console.log(res.data)
  ReferRank.value = res.data
}

const onRangeChanged = async (range) => {
  currentRange.value = range
  await fetchReferRanking(range)
}

function goToDetail(guid) {
  router.push({ name: 'MembersDetail', params: { guid } })
}

// 初次載入
onMounted(async () => {
  dialog.showLoading()
  await fetchRegister()
  await fetchData()
  await fetchReferRanking(currentRange.value)
  loading.value = false
  dialog.hideLoading()
})
</script>
