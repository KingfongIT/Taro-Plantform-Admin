<template>
  <div>
    <v-container fluid class="pa-6">
      <div class="main-title">
        <h2>發佣資料審核</h2>
        <p>符合發佣點數門檻的代理人，需要提供完整證件後才能發佣金</p>
      </div>

      <v-row>
        <v-col>
          <v-card border>
            <v-card-title class="d-flex">
              全部
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
              @update:options="onOptionsUpdate"
              @click:row="(_, { item }) => openDetail(item.id)"
              hover
              style="cursor: pointer"
            >
              <template #item.contractProfiles[0].isDataConfirmed="{ item }">
                <v-chip
                  :color="item.contractProfiles[0]?.isDataConfirmed ? 'green' : 'red'"
                  text-color="white"
                >
                  {{ item.contractProfiles?.[0]?.isDataConfirmed ? '已確認' : '未確認' }}
                </v-chip>
              </template>
            </v-data-table-server>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="detailDialog" max-width="1200" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <h4 class="mr-4">{{ selectedDetail?.realName ?? '詳細資料' }}</h4>
            <v-chip
              :color="selectedDetail.isDataConfirmed ? 'primary' : 'red'"
              text-color="white"
              class="font-weight-bold"
              small
            >
              {{ selectedDetail.isDataConfirmed ? '已確認' : '未確認' }}
            </v-chip>
          </div>
          <v-btn icon variant="text" @click="closeDetail">
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
                    <div v-if="selectedDetail.isDataConfirmed == false">
                      <v-btn
                        prepend-icon="check_circle"
                        class="mr-4"
                        color="primary"
                        variant="flat"
                        @click="applyApprove(selectedDetail.id, selectedDetail.email)"
                      >
                        通過
                      </v-btn>
                      <v-btn
                        v-if="isEditing"
                        prepend-icon="save"
                        class="mr-4"
                        color="secondary"
                        variant="flat"
                        :disabled="!isEditing"
                        @click="updateDetail(selectedDetail.id)"
                      >
                        更新
                      </v-btn>

                      <v-btn
                        prepend-icon="edit"
                        small
                        class="ml-2"
                        variant="flat"
                        color="warning"
                        @click="toggleEditMode"
                      >
                        {{ isEditing ? '取消' : '編輯' }}
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

                <v-card v-if="selectedDetail.isPromotionCenter" variant="flat">
                  <v-card-title> 推廣中心資料 </v-card-title>
                  <v-card-text>
                    <v-table>
                      <tbody>
                        <tr>
                          <td>推廣中心名稱</td>
                          <td>
                            {{ selectedDetail.centerName ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>代理人姓名</td>
                          <td>
                            {{ selectedDetail.realName ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>電子郵件</td>
                          <td>
                            {{ selectedDetail.email ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>推廣中心電話</td>
                          <td>
                            {{ selectedDetail.mobile ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>地址</td>
                          <td>
                            {{
                              selectedDetail.city +
                                selectedDetail.district +
                                selectedDetail.address ?? '無資料'
                            }}
                          </td>
                        </tr>
                        <tr>
                          <td>銀行帳號</td>
                          <td>
                            {{
                              '(' +
                                selectedDetail?.bankCode?.slice(0, 3) +
                                ')' +
                                ' ' +
                                selectedDetail.bankAccount ?? '無資料'
                            }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>

                  <v-card-title> 行政窗口 </v-card-title>
                  <v-card-text>
                    <v-table>
                      <tbody>
                        <tr>
                          <td>姓名</td>
                          <td>
                            {{ selectedDetail.adminName ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>電話</td>
                          <td>
                            {{ selectedDetail.adminPhone ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>行政事宜Email</td>
                          <td>
                            {{ selectedDetail.adminEmail ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>獎金對帳Email</td>
                          <td>
                            {{ selectedDetail.bonusEmail ?? '無資料' }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>

                  <v-card-title> 相關證明文件 </v-card-title>
                  <v-card-text class="d-flex justify-space-around mb-6">
                    <div>
                      <h3>銀行存摺封面</h3>
                      <FileImageComponent
                        :fileId="selectedDetail?.imageBankBookId"
                      ></FileImageComponent>
                      <a
                        :href="getImageUrl(selectedDetail?.imageBankBookId)"
                        target="_blank"
                        rel="noopener"
                      >
                        <v-img
                          :src="getImageUrl(selectedDetail?.imageBankBookId)"
                          max-width="180"
                          class="pointer"
                          fallback-src="/images/No_Img.png"
                        />
                      </a>
                    </div>
                    <div>
                      <h3>相關證書</h3>
                      <FileImageComponent
                        :fileId="selectedDetail?.imageCertificateId"
                      ></FileImageComponent>
                      <a
                        :href="getImageUrl(selectedDetail?.imageCertificateId)"
                        target="_blank"
                        rel="noopener"
                      >
                        <v-img
                          :src="getImageUrl(selectedDetail?.imageCertificateId)"
                          max-width="180"
                          class="pointer"
                          fallback-src="/images/No_Img.png"
                        />
                      </a>
                    </div>
                  </v-card-text>
                </v-card>
                <v-card v-else variant="flat">
                  <v-card-title> 代理人資料 </v-card-title>
                  <v-card-text>
                    <v-table>
                      <tbody>
                        <tr>
                          <td>創業中心名稱</td>
                          <td>
                            <div v-if="selectedDetail.isDataConfirmed === false">
                              <div class="d-flex align-center">
                                <template v-if="isEditing">
                                  <v-text-field
                                    v-model="editUnitName"
                                    hide-details
                                    density="compact"
                                  />
                                </template>
                                <template v-else>
                                  <span>{{ selectedDetail.unitName ?? '無資料' }}</span>
                                </template>
                              </div>
                            </div>
                            <div v-else>
                              {{ selectedDetail.unitName ?? '無資料' }}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>姓名</td>
                          <td>
                            {{ selectedDetail.realName ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>身份證字號</td>
                          <td>
                            {{ selectedDetail.idNumber ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>電子郵件</td>
                          <td>
                            {{ selectedDetail.email ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>行動電話</td>
                          <td>
                            {{ selectedDetail.mobile ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>地址</td>
                          <td>
                            {{
                              selectedDetail.city +
                                selectedDetail.district +
                                selectedDetail.address ?? '無資料'
                            }}
                          </td>
                        </tr>
                        <tr>
                          <td>銀行帳號</td>
                          <td>
                            {{
                              '(' +
                                selectedDetail?.bankCode?.slice(0, 3) +
                                ')' +
                                ' ' +
                                selectedDetail.bankAccount ?? '無資料'
                            }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>

                  <v-card-title> 緊急聯絡人 </v-card-title>
                  <v-card-text>
                    <v-table>
                      <tbody>
                        <tr>
                          <td>聯絡人姓名</td>
                          <td>
                            {{ selectedDetail.contactName ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>關係</td>
                          <td>
                            {{ selectedDetail.relationship ?? '無資料' }}
                          </td>
                        </tr>
                        <tr>
                          <td>連絡電話</td>
                          <td>
                            {{ selectedDetail.contactPhone ?? '無資料' }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>

                  <v-card-title> 相關證明文件 </v-card-title>
                  <v-card-text class="d-flex justify-space-around mb-6">
                    <div>
                      <h3>銀行存摺封面</h3>
                      <FileImageComponent
                        :fileId="selectedDetail?.imageBankBookId"
                      ></FileImageComponent>
                    </div>
                    <div>
                      <h3>身分證正面</h3>
                      <FileImageComponent
                        :fileId="selectedDetail?.imageIdFrontId"
                      ></FileImageComponent>
                    </div>
                    <div>
                      <h3>身分證反面</h3>
                      <FileImageComponent
                        :fileId="selectedDetail?.imageIdBackId"
                      ></FileImageComponent>
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
                            {{ formatDate(selectedDetail?.updatedAt) ?? '無資料' }}
                          </p>
                        </div>
                      </v-card-text>
                      <v-card-text>{{ selectedDetail?.adminMessage ?? '無資料' }}</v-card-text>
                    </v-card>
                  </v-card-text>

                  <v-card-text class="d-flex justify-center align-center">
                    <v-btn
                      v-if="selectedDetail?.isDataConfirmed == false"
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
                            @click="applyRevision(selectedDetail.id, selectedDetail.email)"
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

    <v-snackbar
      v-model="successSnackbar"
      location="bottom"
      color="success"
      text-color="white"
      timeout="3000"
    >
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import DataTableComponent from '@/components/DataTableComponent.vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { debounce } from 'lodash'
import dayjs from 'dayjs'
import { find } from 'lodash'
import { useRoute, useRouter } from 'vue-router'
import FileImageComponent from '@/components/FileImageComponent.vue'

const route = useRoute()
const router = useRouter()
const dialog = useDialogStore()

const memo = ref({})
//標題
const title = ''

//標題列
const headers = [
  { title: '名稱', key: 'contractProfiles[0].realName' },
  // { title: '是否為推廣中心', key: 'contractProfiles[0].isPromotionCenter' },
  { title: '信箱', key: 'contractProfiles[0].email' },
  { title: '手機', key: 'contractProfiles[0].mobile' },
  { title: '申請位階', key: 'payGradeDefinition.grade' },
  {
    title: '資料狀態',
    key: 'contractProfiles[0].isDataConfirmed',
  },
  {
    title: '最後更新時間',
    key: 'contractProfiles[0].updatedAt',
    value: (item) => formatDate(item.contractProfiles[0].updatedAt),
  },
  { title: '', key: 'actions', sortable: false },
]

//日期樣式
function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

//更換樣式

//資料的Key值
const itemKey = 'id'

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
  itemsPerPage: 50,
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

const items = ref([])
const totalCount = ref(0)

//抓取資料
async function fetchData() {
  dialog.showLoading()

  try {
    const sort = options.value.sortBy?.[0] || {}
    const sortBy = sort.key || ''
    const sortDesc = sort.order === 'desc'
    const res = await api.get('/PayGradeContract/GetAllAsync', {
      params: {
        page: options.value.page,
        pageSize: options.value.itemsPerPage,
        sortBy,
        sortDesc,
        searchkeyword: search.value || '',
        status: selectedStatus.value,
      },
    })
    console.log(res.data)
    items.value = res.data.items

    totalCount.value = res.data.totalCount
  } catch (error) {
  } finally {
    dialog.hideLoading()
  }
}

/* 詳情 */
const detailDialog = ref(false)
const selectedDetail = ref({})
const detailLoading = ref(false)

function openDetail(id) {
  router.replace({
    query: {
      ...route.query,
      detailId: String(id),
    },
  })
}

watch(
  () => route.query.detailId,
  async (val) => {
    if (!val) {
      detailDialog.value = false
      selectedDetail.value = {}
      memo.value = ''
      return
    }

    detailDialog.value = true
    await openDetailById(val)
  },
  { immediate: true },
)

async function openDetailById(id) {
  selectedDetail.value = {}
  memo.value = ''
  isEditing.value = false
  editUnitName.value = ''
  try {
    dialog.showLoading()
    const { data } = await api.get(`/Agent/GetContractProfileAsync/${id}`)

    console.log(data)
    selectedDetail.value = data
    memo.value = selectedDetail.value.adminNote
    editUnitName.value = selectedDetail.value.unitName ?? ''
  } catch (err) {
    selectedDetail.value = { name: '讀取失敗' }
  } finally {
    dialog.hideLoading()
  }
}

function closeDetail() {
  router.replace({
    query: {
      ...route.query,
      detailId: undefined,
    },
  })
}

async function updateDetail(id) {
  if (!isEditing.value) return

  const ok = await dialog.askConfirm({
    title: '更新確認',
    message: '您確定要送出修改後的創業中心名稱嗎？',
    isDelete: false,
  })

  if (!ok) return

  try {
    dialog.showLoading()
    const { data } = await api.patch(`/Agent/UpdateReview/${id}`, {
      unitName: editUnitName.value,
    })

    console.log(data)
    selectedDetail.value.unitName = editUnitName.value
    successMessage.value = '創業中心名稱已更新成功'
    successSnackbar.value = true
    isEditing.value = false
  } catch (err) {
    console.log(err)
    dialog.showAxiosError(err, '更新失敗')
  } finally {
    dialog.hideLoading()
  }
}

watch(detailDialog, (isOpen) => {
  if (!isOpen && route.query.detailId) {
    closeDetail()
  }
})

// async function openDetail(item) {
//   selectedDetail.value = {}
//   memo.value = ''
//   detailDialog.value = true
//   try {
//     dialog.showLoading()
//     const res = await api.get(`/Agent/GetContractProfileAsync/${item}`)
//     selectedDetail.value = res.data
//     memo.value = selectedDetail.value.adminNote
//   } catch (err) {
//     selectedDetail.value = { name: '讀取失敗' }
//   } finally {
//     dialog.hideLoading()
//   }
// }

//抓取圖片
const API_BASE_URL = import.meta.env.VITE_API_URL
function getImageUrl(fileId) {
  if (!fileId) {
    // 這邊路徑請用你 public/images 目錄下的預設圖
    return `/images/No_Img.png`
  }

  return `${API_BASE_URL}/File/${fileId}`
}

// 寄送通知信
const notifyDialog = ref(false)

// 成功通知
const successSnackbar = ref(false)
const successMessage = ref('')

// 創業中心名稱編輯模式
const isEditing = ref(false)
const editUnitName = ref('')

function toggleEditMode() {
  if (!isEditing.value) {
    editUnitName.value = selectedDetail.value.unitName ?? ''
    isEditing.value = true
    return
  }

  // 取消編輯，恢復原值
  editUnitName.value = selectedDetail.value.unitName ?? ''
  isEditing.value = false
}

// ✅ 備註編輯控制（如需）

const isMemo = ref(false)
async function toggleEdit(Id, AdminNote) {
  //在完成編輯的時候向後端發送post

  if (isMemo.value) {
    try {
      const res = await api.patch(`/Agent/${Id}/note`, {
        AdminNote,
      })

      if (selectedDetail.value) selectedDetail.value.adminNote = AdminNote
    } catch (err) {}
  }
  isMemo.value = !isMemo.value
}

// 審核通過
async function applyApprove(id, mail) {
  if (window.confirm('你確定要通過此案件嗎？')) {
    try {
      dialog.showLoading()
      const res = await api.patch(`/Agent/${id}/Approve`, {
        email: mail,
      })

      // 更新詳情視窗
      if (selectedDetail.value) {
        selectedDetail.value.isDataConfirmed = true
      }

      // 用 id 在列表中找到那一筆並更新狀態
      const row = items.value.find((x) => x?.id === selectedDetail.value.payGradeContractId)
      if (row?.contractProfiles[0]) {
        row.contractProfiles[0].isDataConfirmed = true
      }
    } catch (error) {
      dialog.showAxiosError(error, '送出失敗')
    } finally {
      dialog.hideLoading()
    }
  }
}

// 審核退件
// async function applyReject(id) {
//   if (window.confirm('你確定要退此案件嗎？')) {
//     try {
//       dialog.showLoading()
//       const res = api.patch(`/PromotionCenter/${id}/Reject`, {
//         id,
//       })
//       const item = items.value.find((x) => x.id === id)
//       if (item) item.applyStatus = 'Rejected'
//       if (details.value[id]) details.value[id].applyStatus = 'Rejected'
//     } catch (error) {
//     }
//   }
// }

// 資料不正確
const revisionMessage = ref('')
async function applyRevision(id, mail) {
  if (window.confirm('送出後無法退回，你確定要送出嗎？')) {
    const adminMessage = revisionMessage.value || ''
    if (!adminMessage) {
      alert('請輸入內容！')
      return
    }
    try {
      dialog.showLoading()
      const res = await api.patch(`/Agent/${id}/Revision`, {
        message: adminMessage,
        email: mail,
      })
      selectedDetail.value.adminMessage = adminMessage
      revisionMessage.value = ''
      notifyDialog.value = false
      dialog.hideLoading()
    } catch (error) {
      // dialog.setError(error.status, error.message);
    } finally {
      dialog.hideLoading()
      revisionMessage.value = ''
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
