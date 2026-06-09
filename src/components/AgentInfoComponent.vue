<template>
  <v-row align="stretch">
    <v-col>
      <v-card class="h-100">
        <v-card-title class="d-flex justify-space-between">
          <span>代理人</span>
          <v-btn variant="outlined" color="primary" @click="openOrgTree">組織圖</v-btn>
        </v-card-title>
        <v-card-text>
          <div class="d-flex align-center mb-4">
            <v-avatar v-if="user.photo" size="x-large">
              <v-img src="https://cdn.vuetifyjs.com/images/profiles/marcus.jpg" cover></v-img>
            </v-avatar>
            <v-avatar v-else size="x-large" color="warning">
              <v-icon icon="person"></v-icon>
            </v-avatar>
            <div class="ml-5">
              <h4>{{ user.name }}</h4>
              <p>{{ user.email }}</p>
            </div>
          </div>
          <div>
            <v-table>
              <tbody>
                <tr>
                  <th>
                    推薦人
                    <v-btn
                      class="mr-3"
                      variant="text"
                      color="primary"
                      @click="referrerHistoryDialog = true"
                      >更換紀錄</v-btn
                    >
                  </th>
                  <td class="text-right">
                    <v-btn class="mr-3" variant="text" color="primary" @click="openReferrerDialog"
                      >更換</v-btn
                    >{{ referrer?.referrerName ?? '無推薦人' }}
                  </td>
                </tr>
                <tr>
                  <th>總推廣註冊人數</th>
                  <td class="text-right">{{ referCount }}</td>
                </tr>
                <!-- <tr>
                  <td>有效下線人數</td>
                  <td>建置中</td>
                </tr> -->
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col>
      <v-card class="h-100">
        <v-card-title class="d-flex justify-space-between">
          <span>位階狀態</span>
        </v-card-title>
        <v-card-text>
          <v-table>
            <tbody>
              <tr>
                <td>位階狀態：</td>
                <td>
                  <span v-if="getGradeStatus()" style="color: green">正常</span>
                  <span v-else style="color: red">異常</span>
                </td>
              </tr>
              <tr>
                <td>目前位階：</td>
                <td>{{ user.currentPayGradeName }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col>
      <v-card title="雞肉飼料" class="h-100">
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
                <td>已失效：</td>
                <td>
                  <span> {{ expiredToken }} </span> <span> 顆 </span>
                </td>
              </tr>
              <tr>
                <td>歷史總累積（含有效與無效）</td>
                <td>
                  <span> {{ historyToken }} </span> <span> 顆 </span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span class="mr-3">合約資料</span>
          <v-btn variant="tonal" @click="openChangeLevelDialog">更換位階</v-btn>
        </v-card-title>
        <v-data-table-server
          :headers="headers"
          :item-value="itemKey"
          :items="items"
          :items-length="totalCount"
          :options="options"
          loading-text="資料載入中..."
          @update:options="onOptionsUpdate"
        >
          <template #select_Slot> </template>
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" class="font-weight-bold">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
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
          <!-- slot: 詳情按鈕 -->
          <template #item.actions="{ item }">
            <v-btn class="mr-3" color="primary" variant="flat" @click="openDetail(item.id)"
              >繳費詳情</v-btn
            >
            <v-btn color="primary" variant="flat" @click="goContract(item.id)">合約資料</v-btn>
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

  <!-- 繳費詳情 -->
  <v-dialog v-model="detailDialog" width="auto" scrollable>
    <v-card v-if="billsSorted && Object.keys(billsSorted).length > 0">
      <v-card-title class="d-flex align-center justify-space-between">
        <h4>繳費詳情</h4>
        <v-btn icon="close" size="small" variant="text" @click="detailDialog = false"> </v-btn>
      </v-card-title>

      <v-table height="auto" fixed-header hover>
        <thead>
          <tr>
            <th>繳費年月</th>
            <th>行政受理費</th>
            <th>繳費狀態</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in billsSorted" :key="item.id">
            <td>{{ item.billingYear }}年{{ String(item.billingMonth).padStart(2, '0') }}月</td>
            <td class="text-right">{{ item.tokenAmountDue }}</td>
            <td class="text-right">{{ item.isPaid ? '已繳費' : '－' }}</td>
            <!-- <td class="text-right">
              <v-btn variant="flat" color="primary" @click="freeBill(item.id)">免費</v-btn>
            </td> -->
          </tr>
        </tbody>
      </v-table>
    </v-card>
    <v-card v-else title="無相關繳費資料"> </v-card>
  </v-dialog>

  <!-- 更換推薦人 -->
  <v-dialog v-model="referrerDialog" max-width="400">
    <v-card>
      <v-card-title>選擇推薦人</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="searchReferrer"
          density="compact"
          placeholder="搜尋名稱或Email"
          :loading="referrerLoading"
          clearable
        ></v-text-field>
        <v-table hover v-if="referrerOptions">
          <thead :style="{ background: '#F5F5F5' }">
            <tr>
              <th>姓名</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in referrerOptions"
              @click="selectedReferrer = item"
              :key="item.guid"
              :style="rowReferrerStyle(item)"
              style="cursor: pointer"
            >
              <td>{{ item.name ?? '無名稱' }}</td>
              <td>{{ item.email }}</td>
            </tr>
          </tbody>
        </v-table>

        <div v-else-if="!searchReferrer" class="text-center border">請輸入名稱或Eamil搜尋</div>
        <div v-else-if="referrerOptions.length == 0">查無結果</div>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="tonal" @click="cancelReferrerDialog">取消</v-btn>
        <v-btn variant="flat" color="primary" @click="saveReferrerDialog">確認</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 更換位階 -->
  <v-dialog v-model="changeLevelDialog" max-width="400">
    <v-card>
      <v-card-title>變更位階</v-card-title>
      <v-card-text>
        <div class="mb-3">
          <p class="text-error">變更後，新位階將立即有效。</p>
        </div>
        <div>
          <p>目前位階</p>
          <v-text-field disabled>{{ user.currentPayGradeName }}</v-text-field>
        </div>
        <div>
          <p>新位階</p>
          <v-select
            v-model="selectedGrade"
            :items="payGradeDefinition"
            item-value="id"
            item-title="name"
            return-object
          ></v-select>
        </div>
        <div>
          <p>合約結束日</p>
          <v-date-input
            input-format="yyyy-mm-dd"
            label="選擇日期"
            v-model="selectedEndDate"
          ></v-date-input>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="tonal" @click="cancelGradeDialog">取消</v-btn>
        <v-btn variant="flat" color="primary" @click="saveGradeDialog">確認變更</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 組織圖 -->
  <v-dialog v-model="orgTreeDialog" width="900">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>組織圖</span>
        <v-btn icon="close" variant="text" @click="orgTreeDialog = false" />
      </v-card-title>

      <v-divider />

      <v-card-text style="max-height: 70vh; overflow: auto">
        <!-- 你的子元件 -->
        <OrgTree v-if="referCount > 0" :root-guid="rootGuid" />
        <div v-else>無組織資料</div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="orgTreeDialog = false">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 推薦人更換紀錄 -->
  <v-dialog v-model="referrerHistoryDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>推薦人更換紀錄</span>
        <v-spacer></v-spacer>
        <v-btn icon="close" variant="text" @click="referrerHistoryDialog = false"></v-btn>
      </v-card-title>
      <v-card-text>
        <ReferrerHistory v-if="referrerHistoryDialog" :agent-guid="rootGuid" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import DataTableComponent from './DataTableComponent.vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebouncedAsync } from '@/utils/debounce'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import OrgTree from './OrgTree.vue'
import ReferrerHistory from './ReferrerHistory.vue'
import axios from 'axios'

const dialog = useDialogStore()
const route = useRoute()
const props = defineProps({
  id: { type: String, required: true },
})

const referrer = ref({})
const referrerDialog = ref(false)
const referrerLoading = ref(false)
const referrerOptions = ref([])
const searchReferrer = ref('')
const selectedReferrer = ref()
const referCount = ref(0)

const payGradeDefinition = ref([])
const selectedGrade = ref()
const selectedEndDate = ref()
const changeLevelDialog = ref(false)

// 雞肉飼料
const tokenBalance = ref(0)
const expiredToken = ref(0)
const historyToken = ref(0)

watch(selectedGrade, (val) => {})

const orgTreeDialog = ref(false)
const rootGuid = computed(() => route.params.id)

const referrerHistoryDialog = ref(false)

//將狀態更改
const statusTextMap = {
  Active: '啟用中',
  Cancelled: '取消',
  Expired: '已過期',
  Suspended: '停用',
}
const statusColorMap = {
  Active: 'success',
  Cancelled: 'warning',
  Expired: 'info',
  Suspended: 'error',
}

function getStatusText(status) {
  return statusTextMap[status] || status
}

function getStatusColor(status) {
  return statusColorMap[status] || 'secondary'
}

//基本資料
const user = ref({})
const guid = route.params.id

//抓代理人資訊
async function fetchUserData() {
  try {
    const { data } = await api.get(`/Agent/GetAsync/${guid}`)
    user.value = data
  } catch (error) {
    dialog.showAxiosError(`/`)
  }
}

//判斷目前位階是否正常
function getGradeStatus() {
  if (!user.value.isPaid) {
    return true
  } else {
    return false
  }
}

async function fetchData() {
  dialog.showLoading()
  await fetchPGCData()
  await fetchUserData()
  await fetchReferrer()
  await fetchToken()
  await fetchExpiredToken()
  await fetchHistoryToken()
  dialog.hideLoading()
}

/* DataTable */
//標題列
const headers = [
  { title: '購買日期', key: 'purchaseDate', value: (item) => formatDate(item.purchaseDate) },
  { title: '合約位階', key: 'originalTemplate' },
  { title: '目前位階', key: 'currentContractTemplate' },
  { title: '合約起始日期', key: 'startDate', value: (item) => formatDate(item.startDate) },
  { title: '合約終止日期', key: 'endDate', value: (item) => formatDate(item.endDate) },
  {
    title: '繳費狀態',
    key: 'IsTemporarilyDowngraded',
    value: (item) => {
      if (item.IsTemporarilyDowngraded == true) {
        return '未繳費'
      }
      return '繳費中'
    },
  },
  { title: '合約狀態', key: 'status' },
  { title: '', key: 'actions' },
]

//日期樣式
function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD')
}

// 📌 搜尋與篩選
const search = ref('')
const searchLabel = ref('')

//資料的Key值
const itemKey = 'id'

//當篩選變動時回傳
function onOptionsUpdate(val) {
  options.value = val
  fetchData()
}

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

//抓合約資訊
async function fetchPGCData() {
  try {
    const sort = options.value.sortBy?.[0] || {}
    const sortBy = sort.key || ''
    const sortDesc = sort.order === 'desc'
    const { data } = await api.get('/PayGradeContract/GetByGuidAsync', {
      params: {
        page: options.value.page,
        pageSize: options.value.itemsPerPage,
        sortBy,
        sortDesc,
        searchkeyword: search.value || '',
        guid: guid,
      },
    })

    items.value = data.items
    totalCount.value = data.totalCount
  } catch (error) {
    dialog.showAxiosError(error, '合約資料抓取錯誤')
  }
}

/* 詳情 */
const detailDialog = ref(false)
const rawBillsObj = ref({})
const detailLoading = ref(false)

//將繳費資訊做排序
const billsSorted = computed(() => {
  return Object.values(rawBillsObj.value).sort(
    (a, b) => a.billingYear - b.billingYear || a.billingMonth - b.billingMonth,
  )
})

async function openDetail(id) {
  detailDialog.value = true
  try {
    dialog.showLoading()
    const res = await api.get(`/Agent/GetAllBillAsync/${id}`)
    rawBillsObj.value = res.data
  } catch (error) {
    dialog.showAxiosError(error, '帳單抓取錯誤')
  } finally {
    dialog.hideLoading()
  }
}

/* 更換位階 */
function cancelGradeDialog() {
  changeLevelDialog.value = false
}

async function fetchGrade() {
  try {
    const { data } = await api.get(`/PayGradeDefinition`)
    payGradeDefinition.value = data
  } catch (error) {
    dialog.showAxiosError(error, '位階列表載入失敗')
  }
}

async function saveGradeDialog() {
  const ok = await dialog.askConfirm({
    title: '確認變更代理人位階嗎?',
    message: `
    <ul>
      <li>變更後，新位階將立即有效。</li>
      <li>變更後，代理人後續雞肉飼料與分潤，將依新位階計算。</li>
      <li>合約行政費將依照原申請位階收費不變，僅分佣依照新位階計算。</li>
    </ul>
    </br>
    <p><b>請確認是否繼續進行位階調整？</b></p>
    `,
    isDelete: true,
  })

  if (!ok) return

  try {
    const payload = {
      contractId: items.value?.[0]?.id,
      targetTemplateId: selectedGrade.value.id,
      endDate: selectedEndDate.value,
      reason: `後台管理員調整位階`,
    }
    // await api.patch(`/Agent/UpdatePGC/${guid}`, payload)

    await axios.post(
      `${import.meta.env.VITE_ANOTHER_API_URL}/api/grade/admin/grant-temporary-rank`,
      payload,
    )

    await fetchUserData()
    await fetchPGCData()

    changeLevelDialog.value = false
  } catch (error) {
    dialog.showAxiosError(error, '位階更新失敗')
  }
}

/* 更換推薦人 */
async function fetchReferrer() {
  try {
    const { data } = await api.get(`/Referrer/${guid}`)
    referrer.value = data.referrer
    referCount.value = data.count
  } catch (error) {
    dialog.showAxiosError(error, '資料抓取錯誤')
  }
}

function openReferrerDialog() {
  referrerDialog.value = true
}

function rowReferrerStyle(item) {
  return selectedReferrer.value?.guid === item.guid ? { background: '#E3F2FD' } : {}
}

async function fetchAccount() {
  referrerLoading.value = true
  try {
    const { data } = await api.get(`/Account/Filter`, {
      params: { search: searchReferrer.value },
    })
    referrerOptions.value = data
  } catch (error) {
    dialog.showAxiosError(error, '資料抓取錯誤')
  } finally {
    referrerLoading.value = false
  }
}

const debounceSearchReferrer = useDebouncedAsync(fetchAccount, 300)

function cancelReferrerDialog() {
  referrerDialog.value = false
  referrerOptions.value = null
  searchReferrer.value = ''
}

async function saveReferrerDialog() {
  const ok = await dialog.askConfirm({
    title: '確認變更推薦人嗎?',
    message:
      '確認後，將變更推薦人。\n所屬的組織線會一併轉移。\n未來代理人的組織佣金將發放給新的推薦人。',
    isDelete: true,
  })

  if (!ok) return

  dialog.showLoading()
  try {
    const payload = {
      ...selectedReferrer.value,
      currentPayGradeId: user.value.currentPayGradeId,
    }
    await api.patch(`/Referrer/${guid}`, payload)

    await fetchReferrer()
    cancelReferrerDialog()
  } catch (error) {
    dialog.showAxiosError(error, '推薦人更換失敗')
  } finally {
    dialog.hideLoading()
  }
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

function openChangeLevelDialog() {
  changeLevelDialog.value = true
  fetchGrade()
}

watch(searchReferrer, async (val) => {
  const search = val.trim()
  await debounceSearchReferrer()
})

async function freeBill(params) {}

function openOrgTree() {
  orgTreeDialog.value = true
}

const router = useRouter()

function goContract(contractProfileId) {
  router.push({ name: 'AgentReview', query: { detailId: String(contractProfileId) } })
}
</script>
