<template>
  <div>
    <v-container fluid class="pa-6">
      <div class="main-title">
        <h2>推廣中心申請審核</h2>
      </div>
      <v-card border>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="mr-3">{{ title }}</span>
          <v-select
            v-model="selectedStatus"
            max-width="150"
            :items="selectOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
          />
          <v-spacer />
          <v-text-field
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
          :items="items"
          :item-value="itemKey"
          :options="options"
          :items-length="totalCount"
          @update:options="onOptionsUpdate"
          hover
        >
          <template #item.centerName="{ item }">
            <v-btn color="primary" variant="text" @click="openDetail(item.id)">{{
              item.centerName
            }}</v-btn>
          </template>
          <!-- 用 slot="item.你的key" 來自訂欄位 -->
          <template #item.applyStatus="{ item }">
            <v-chip
              :color="getStatusColor(item.applyStatus)"
              text-color="white"
              class="font-weight-bold"
              small
            >
              {{ getStatusText(item.applyStatus) }}
            </v-chip>
          </template>
        </v-data-table-server>
      </v-card>
    </v-container>

    <v-dialog v-model="detailDialog" max-width="1200" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <h4 class="mr-4">{{ selectedDetail?.centerName ?? '詳細資料' }}</h4>
            <v-chip
              v-if="selectedDetail"
              :color="getStatusColor(selectedDetail.applyStatus)"
              text-color="white"
              class="font-weight-bold"
              small
            >
              {{ getStatusText(selectedDetail.applyStatus) }}
            </v-chip>
          </div>
          <v-btn icon variant="text" @click="detailDialog = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="detailTable">
          <v-skeleton-loader v-if="detailLoading" type="paragraph, image, table" class="ma-4" />

          <v-container v-else>
            <v-row align="stretch">
              <!-- 基本資料 -->
              <v-col class="detail">
                <v-card variant="flat" class="mb-3">
                  <v-card-title class="d-flex align-center justify-space-between">
                    <h4 class="mr-4">審核</h4>
                    <div
                      v-if="
                        selectedDetail.applyStatus == 'Pending' ||
                        selectedDetail.applyStatus == 'Revised'
                      "
                    >
                      <v-btn
                        prepend-icon="check_circle"
                        class="mr-4"
                        color="primary"
                        variant="flat"
                        @click="applyApprove(selectedDetail.id)"
                      >
                        通過
                      </v-btn>
                      <!-- <v-btn
                        prepend-icon="cancel"
                        class="mr-4"
                        color="red-lighten-1"
                        variant="flat"
                        @click="applyReject(selectedDetail.id)"
                      >
                        退件
                      </v-btn> -->
                    </div>
                  </v-card-title>
                </v-card>

                <v-card variant="flat">
                  <v-card-title> 推廣中心資料 </v-card-title>
                  <v-card-text>
                    <v-table>
                      <tbody>
                        <tr>
                          <td>推廣中心名稱</td>
                          <td>{{ selectedDetail?.centerName ?? '無資料' }}</td>
                        </tr>
                        <tr>
                          <td>公司統一編號</td>
                          <td>{{ selectedDetail?.taxId ?? '無資料' }}</td>
                        </tr>
                        <tr>
                          <td>代表人姓名</td>
                          <td>{{ selectedDetail?.ownerName ?? '無資料' }}</td>
                        </tr>

                        <tr>
                          <td>推廣中心連絡電話</td>
                          <td>{{ selectedDetail?.centerPhone ?? '無資料' }}</td>
                        </tr>
                        <tr>
                          <td>推廣中心地址</td>
                          <td>
                            {{
                              (selectedDetail?.city ?? '') +
                                (selectedDetail?.district ?? '') +
                                (selectedDetail?.address ?? '') || '無資料'
                            }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>

                  <v-card-title> 行政窗口人員 </v-card-title>
                  <v-card-text>
                    <v-table>
                      <tbody>
                        <tr>
                          <td>姓名</td>
                          <td>{{ selectedDetail?.adminName ?? '無資料' }}</td>
                        </tr>
                        <tr>
                          <td>連絡電話</td>
                          <td>{{ selectedDetail?.adminPhone ?? '無資料' }}</td>
                        </tr>
                        <tr>
                          <td>行政事宜Email</td>
                          <td>{{ selectedDetail?.adminEmail ?? '無資料' }}</td>
                        </tr>
                        <tr>
                          <td>獎金對帳Email</td>
                          <td>{{ selectedDetail?.bonusEmail ?? '無資料' }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>

                  <v-card-title> 相關證明文件 </v-card-title>
                  <v-card-text class="d-flex justify-space-around mb-6">
                    <div>
                      <h3>銀行存摺封面</h3>
                      <FileImage :fileId="selectedDetail?.imageBankBookId"></FileImage>
                    </div>
                    <div>
                      <h3>相關證書</h3>
                      <FileImage :fileId="selectedDetail?.imageCertificateId"></FileImage>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 通知信 -->
              <v-col cols="4">
                <v-card variant="flat" class="h-100">
                  <v-card-title> 通知信 </v-card-title>
                  <v-card-text>
                    *本功能用於通知申請者資料異常，信件內容應包含錯誤欄位及修正建議
                  </v-card-text>

                  <v-card-text :style="'overflow-y:auto;max-height:550px;'">
                    <v-card v-if="selectedDetail?.adminMessage" class="message mb-2" variant="flat">
                      <v-card-text class="d-flex justify-space-between align-center">
                        <div class="d-flex align-center">
                          <p class="mr-3">
                            {{ formatDate(selectedDetail?.userUpdatedAt) ?? '無資料' }}
                          </p>
                        </div>
                      </v-card-text>
                      <v-card-text>{{ selectedDetail?.adminMessage ?? '無資料' }}</v-card-text>
                    </v-card>
                  </v-card-text>

                  <v-card-text class="d-flex justify-center align-center">
                    <v-btn
                      v-if="
                        selectedDetail.applyStatus == 'Pending' ||
                        selectedDetail.applyStatus == 'Revised'
                      "
                      prepend-icon="drafts"
                      color="primary"
                      variant="outlined"
                      @click="notifyDialog = true"
                    >
                      寄送通知信
                    </v-btn>

                    <!-- 內層：撰寫通知信 Dialog -->
                    <v-dialog v-model="notifyDialog" width="auto" persistent>
                      <v-card width="500" title="寄信給申請人">
                        <v-card-text>
                          <v-textarea rows="8" v-model="revisionMessage" hide-details />
                        </v-card-text>
                        <template #actions>
                          <v-btn color="secondary" variant="flat" @click="notifyDialog = false"
                            >取消</v-btn
                          >
                          <v-btn
                            class="ml-3"
                            color="primary"
                            variant="flat"
                            @click="applyRevision(selectedDetail.id)"
                            >送出</v-btn
                          >
                        </template>
                      </v-card>
                    </v-dialog>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 備註 -->
              <v-col cols="3">
                <v-card variant="flat" class="memo h-100">
                  <v-card-title> 備註 </v-card-title>
                  <v-card-text>
                    <v-textarea
                      :readonly="!isMemo"
                      v-model="memo"
                      :placeholder="selectedDetail?.adminNote ?? '無資料'"
                      bg-color="grey-lighten-3"
                      color="primary"
                    />
                  </v-card-text>
                  <v-card-text class="text-right">
                    <v-btn color="primary" @click="toggleEdit(selectedDetail.id, memo)">
                      {{ isMemo ? '完成編輯' : '編輯' }}
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { debounce } from 'lodash'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import DataTableComponent from '@/components/DataTableComponent.vue'
import dayjs from 'dayjs'
import { useReviewStore } from '@/stores/review'
import FileImage from '@/components/FileImageComponent.vue'

const dialog = useDialogStore()
const review = useReviewStore()

//將狀態更改
const statusTextMap = {
  Pending: '待審核',
  Revision: '待修正',
  Revised: '已修正',
  Rejected: '退件',
  Approved: '通過',
}
const statusColorMap = {
  Pending: 'warning',
  Revision: 'info',
  Revised: 'warning',
  Rejected: 'error',
  Approved: 'success',
}

function getStatusText(status) {
  return statusTextMap[status] || status
}

function getStatusColor(status) {
  return statusColorMap[status] || 'secondary'
}

// 📌 標題與欄位設定
const title = '推廣中心申請'
const headers = [
  { title: '申請日期', key: 'createdAt', value: (item) => formatDate(item.createdAt) },
  { title: '推廣中心名稱', key: 'centerName' },
  { title: '統編', key: 'taxId' },
  { title: '代表人', key: 'ownerName' },
  { title: '審核狀態', key: 'applyStatus' },
  { title: '最後更新時間', key: 'confirmedAt', value: (item) => formatDate(item.confirmedAt) },
  { title: '', key: 'actions', sortable: false },
]

const itemKey = 'id'

// 📌 表格核心狀態
const items = ref([])
const totalCount = ref(0)

// 📌 分頁 + 排序選項（同步給 BaseTable）
const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  search: '',
})

// 📌 搜尋與篩選
const search = ref('')
const searchLabel = ref('搜尋名稱')

const selectedStatus = ref(0)
const selectOptions = [
  { title: '全部', value: 0 },
  { title: '待審核', value: 1 },
  { title: '待修正', value: 2 },
  { title: '退件', value: 3 },
  { title: '通過', value: 4 },
]

//日期樣式
function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

// 📡 抓資料（範例 API）
async function fetchData() {
  dialog.showLoading()
  try {
    const sort = options.value.sortBy?.[0] || {}
    const sortBy = sort.key || ''
    const sortDesc = sort.order === 'desc'

    const res = await api.get('/PromotionCenter/GetAll', {
      params: {
        page: options.value.page,
        pageSize: options.value.itemsPerPage,
        sortBy,
        sortDesc,
        searchkeyword: search.value || '',
        status: selectedStatus.value,
      },
    })

    items.value = res.data.items

    console.log(items.value)
    totalCount.value = res.data.totalCount
  } catch (error) {
    console.error(error)
    dialog.setError('讀取失敗', '請稍後再試')
  } finally {
    dialog.hideLoading()
  }
}

/* 詳情按鈕 */
const detailDialog = ref(false)
const selectedDetail = ref({})
const detailLoading = ref(false)

async function openDetail(item) {
  selectedDetail.value = {}
  memo.value = ''
  detailDialog.value = true
  detailLoading.value = true
  try {
    const res = await api.get(`/PromotionCenter/Get`, {
      params: { id: item },
    })

    selectedDetail.value = res.data
    console.log(selectedDetail.value)
    memo.value = selectedDetail.value.adminNote
  } catch (err) {
    selectedDetail.value = { name: '讀取失敗' }
  } finally {
    detailLoading.value = false
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL

//抓取圖片
// fetchImageBlobUrl(fileId)

// function getImageUrl(fileId) {
//   if (!fileId) {
//     // 這邊路徑請用你 public/images 目錄下的預設圖
//     return `/images/No_Img.png`
//   }
//   return `${API_BASE_URL}/file/${fileId}`
// }

// 📌 防抖搜尋
const debouncedFetch = debounce(fetchData, 500)
watch(search, () => {
  options.value.page = 1
  debouncedFetch()
})

// 📌 篩選變動時重新查詢
watch(selectedStatus, () => {
  options.value.page = 1
  fetchData()
})

// 📌 分頁或排序改變時
function onOptionsUpdate(val) {
  options.value = val
  fetchData()
}

// 寄送通知信
const notifyDialog = ref(false)

// ✅ 備註編輯控制（如需）
const memo = ref('')
const isMemo = ref(false)
async function toggleEdit(Id, AdminNote) {
  //在完成編輯的時候向後端發送post
  if (isMemo.value) {
    try {
      const res = await api.patch(`/PromotionCenter/${Id}/note`, {
        AdminNote,
      })
      if (selectedDetail.value) selectedDetail.value.adminNote = AdminNote
    } catch (err) {
      console.error(err)
      return
    }
  }
  isMemo.value = !isMemo.value
}

// 審核通過
async function applyApprove(id) {
  if (window.confirm('你確定要通過此案件嗎？')) {
    try {
      dialog.showLoading()
      const res = await api.post(`/PromotionCenter/${id}/Approve`, null)

      console.log(res.data)
      //更新詳情狀態
      if (selectedDetail.value) {
        selectedDetail.value.applyStatus = 'Approved'
      }

      //更新表格狀態
      const item = items.value.find((x) => x.id === id)
      if (item) {
        item.applyStatus = 'Approved'
      }

      //將navbar紅點狀態-1
      review.promotionCenterCount--
    } catch (error) {
      console.log(error)
    } finally {
      dialog.hideLoading()
    }
  }
}

// 審核退件
async function applyReject(id) {
  if (window.confirm('你確定要退此案件嗎？')) {
    try {
      dialog.showLoading()
      const res = await api.patch(`/PromotionCenter/${id}/Reject`, {
        id,
      })

      //更新詳情狀態
      if (selectedDetail.value) {
        selectedDetail.value.applyStatus = 'Rejected'
      }

      //更新表格狀態
      const item = items.value.find((x) => x.id === id)
      if (item) {
        item.applyStatus = 'Rejected'
      }

      //將navbar紅點狀態-1
      review.promotionCenterCount--
    } catch (error) {
      console.log(error)
    } finally {
      dialog.hideLoading()
    }
  }
}

// 審核待修正
const revisionMessage = ref('')
async function applyRevision(id) {
  if (window.confirm('送出後無法退回，你確定要送出嗎？')) {
    const adminMessage = revisionMessage.value || ''
    if (!adminMessage) {
      alert('請輸入內容！')
      return
    }
    try {
      dialog.showLoading()
      const res = await api.patch(`/PromotionCenter/${id}/Revision`, {
        id,
        adminMessage,
      })

      console.log(res.data)
      //更新詳情狀態
      if (selectedDetail.value) {
        selectedDetail.value.applyStatus = 'Revision'
        selectedDetail.value.adminMessage = adminMessage
        selectedDetail.value.userUpdatedAt = new Date().toISOString()
      }

      //更新表格狀態
      const item = items.value.find((x) => x.id === id)
      if (item) {
        item.applyStatus = 'Revision'
        item.confirmedAt = new Date().toISOString()
      }

      //清空留言資料
      revisionMessage.value = ''
      notifyDialog.value = false

      //將navbar紅點狀態-1
      review.promotionCenterCount--
      dialog.hideLoading()
    } catch (error) {
      console.log(error)
      // dialog.setError(error.status, error.message);
    } finally {
      dialog.hideLoading()
    }
  }
}
</script>

<style scoped lang="scss">
.detailTable {
  background: rgb(var(--v-theme-secondary));
}

.detail {
  h4 {
    color: rgb(var(--v-theme-primary));
  }
}

.message {
  background: rgb(var(--v-theme-secondary));
  .status {
    color: rgb(var(--v-theme-primary));
  }
  .status.draft {
    color: rgb(var(--v-theme-secondary));
  }
}

.memo {
  .v-card-text {
    .v-textarea {
      background: rgb(var(--v-theme-secondary));
    }
  }
}
</style>
