<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>小芋頭社群</h2>
    </div>
    <v-row>
      <v-col>
        <v-card border></v-card>
      </v-col>
      <v-col><v-card border></v-card></v-col>
    </v-row>
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
            @update:options="onOptionsUpdate"
          >
            <!-- 類別篩選 -->
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
            <!-- 搜尋關鍵字 -->
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
            <!-- 操作按鈕 -->
            <template #item.actions="{ item }">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon="more_vert" v-bind="props" variant="text" />
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
          </DataTableComponent>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import DataTableComponent from '@/components/DataTableComponent.vue'
import { useDialogStore } from '@/stores/dialog'
import { ref, watch } from 'vue'
import { debounce } from 'lodash'
import api from '@/plugins/api'

const dialog = useDialogStore()

//標題
const title = ''

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

//搜尋關鍵字
const search = ref('')
const searchLabel = ref('搜尋名稱或Eamil')

// 當搜尋輸入改變時重新查詢
watch(search, (val) => {
  debouncedFetch()
})

//當篩選變動時回傳
function onOptionsUpdate(val) {
  options.value = val
  fetchData()
}

//抓取資料
items.value = null
totalCount.value = 0
// async function fetchData() {
//   try {
//     //抓會員資料
//     const sort = options.value.sortBy?.[0] || {}
//     const sortBy = sort.key || ''
//     const sortDesc = sort.order === 'desc'
//     dialog.showLoading()
//     // const res = await api.get('/Account/GetAll', {
//     //   params: {
//     //     page: options.value.page,
//     //     pageSize: options.value.itemsPerPage,
//     //     sortBy,
//     //     sortDesc,
//     //     searchkeyword: search.value || '',
//     //     status: selectedStatus.value,
//     //   },
//     // })

//     // console.log(res.data)

//     items.value = res.data.items
//     totalCount.value = res.data.totalCount
//     dialog.hideLoading()
//   } catch (error) {
//     console.error(error)
//     dialog.showError('讀取失敗', '資料取得失敗，請稍後再試')
//   } finally {
//     dialog.hideLoading()
//   }
// }
//防抖效果，延遲500ms執行
const debouncedFetch = debounce(fetchData, 500)
</script>
