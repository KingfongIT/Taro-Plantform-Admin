<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>代理人</h2>
    </div>
    <!-- <v-row>
      <v-col cols="4">
        <MemberDonutChart :list="[]" :title="chartTitle" />
      </v-col>
    </v-row> -->

    <v-row>
      <v-col>
        <v-card border>
          <v-card-title>
            <div class="d-flex justify-space-between">
              <div>
                <v-select
                  width="160"
                  v-model="selectedStatus"
                  :items="selectOptions"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  hide-details
                ></v-select>
              </div>

              <v-text-field
                v-model="searchKeyword"
                prepend-inner-icon="search"
                label="搜尋名稱"
                hide-details
                density="compact"
                max-width="300"
              ></v-text-field>
            </div>
          </v-card-title>
          <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="serverItems"
            :items-length="totalItems"
            :search="search"
            item-value="accountguid"
            @update:options="loadItems"
            hover
          >
            <template #item.name="{ item }">
              <v-btn variant="text" color="primary" @click="goToDetail(item.accountGuid)">{{
                item.name
              }}</v-btn>
            </template>
            <template #item.status="{ item }">
              <v-chip
                size="small"
                variant="text"
                :color="getStatusColor(item.status)"
                :prepend-icon="getStatusIcon(item.status)"
                class="font-weight-bold"
                small
              >
                {{ getStatusText(item.status) }}
              </v-chip>
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
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import router from '@/router'
import api from '@/plugins/api'

function getStatusIcon(status) {
  if (status) {
    return 'check_circle'
  }
  return 'block'
}

function getStatusText(status) {
  if (status) {
    return '正常'
  }
  return '異常'
}

function getStatusColor(status) {
  if (status) {
    return 'success'
  }
  return 'warning'
}

const itemsPerPage = ref(10)
const headers = [
  { title: '名稱', key: 'name' },
  { title: '信箱', key: 'email' },
  { title: '目前位階', key: 'positionGrade' },
  // { title: '申請位階', key: 'applyGrade' },
  { title: '付款狀態', key: 'status' },
  { title: '申請日期', key: 'createdDate', value: (item) => formatDate(item.createdDate) },
  { title: '', key: 'detail', sortable: false },
]

//日期樣式
function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

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
const serverItems = ref([])
const loading = ref(true)
const totalItems = ref(0)
const searchKeyword = ref('')
const search = ref('')

function parseSort(sortBy) {
  if (!Array.isArray(sortBy) || sortBy.length === 0) {
    return { sortKey: '', sortDesc: false }
  }
  const { key, order } = sortBy[0] // 若支援多欄位可再展開
  return {
    sortKey: key,
    sortDesc: order === 'desc',
  }
}

async function loadItems({ page, itemsPerPage, sortBy }) {
  loading.value = true
  console.log(page, itemsPerPage, sortBy, selectedStatus.value, searchKeyword.value)

  const { sortKey, sortDesc } = parseSort(sortBy)

  const res = await api.get('/Agent/GetAllAsync', {
    params: {
      page: page,
      pageSize: itemsPerPage,
      sortBy: sortKey || '',
      sortDesc: sortDesc,
      searchKeyword: searchKeyword.value || '',
      status: selectedStatus.value,
    },
  })

  console.log(res.data)
  serverItems.value = res.data.items
  totalItems.value = res.data.totalCount
  loading.value = false
}
watch(searchKeyword, () => {
  search.value = String(Date.now())
})
watch(selectedStatus, () => {
  search.value = String(Date.now())
})

//跳轉詳情頁
function goToDetail(guid) {
  router.push({ name: 'AgentDetail', params: { id: guid } })
}
</script>
<style scoped lang="scss">
.custom-table :deep(table thead) {
  background-color: #f5f5f5;
  color: #333;
}
</style>
