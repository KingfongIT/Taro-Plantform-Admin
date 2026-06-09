<template>
  <v-container fluid class="pa-0">
    <div class="pa-4"><h2 class="text-primary">顧問師</h2></div>

    <v-divider></v-divider>
    <v-row class="fill-height">
      <!-- 左側：顧問師分類 -->
      <v-col cols="3">
        <ConsultantCategoryComponent v-model:selectedCategory="selectedCategory" />
      </v-col>

      <!-- 右側：顧問師列表 -->
      <v-col cols="9" class="d-flex flex-column">
        <v-container>
          <v-card border class="flex-grow-1 d-flex flex-column">
            <!-- 標題列 -->
            <v-card-title class="d-flex align-center">
              <span class="text-h6">{{ selectedCategory?.name }}</span>
              <v-spacer />

              <v-btn
                v-if="selectedCategory"
                prepend-icon="add"
                class="mr-3"
                color="primary"
                variant="flat"
                @click="openCreate"
              >
                新增
              </v-btn>

              <v-text-field
                v-model="search"
                density="compact"
                label="Search"
                prepend-inner-icon="search"
                variant="solo-filled"
                flat
                hide-details
                single-line
                class="ml-2"
                style="max-width: 260px"
              />
            </v-card-title>

            <v-divider />

            <!-- 資料表區域 -->
            <div class="flex-grow-1">
              <v-data-table
                :headers="headers"
                :items="serverItems"
                :search="search"
                item-key="id"
                @click:row="(_, { item }) => openEdit(item.id)"
                hover
                class="elevation-0"
                style="cursor: pointer"
              >
                <template #item.actions="{ item }">
                  <v-btn
                    color="error"
                    variant="text"
                    size="small"
                    prepend-icon="delete"
                    @click.stop="confirmDelete(item.id)"
                  >
                    刪除
                  </v-btn>
                </template>
                <template #no-data>
                  <div class="text-center pa-6">
                    <img src="/images/NoSearch.svg" alt="no-data" />
                    <h6 class="mt-2">搜尋無結果</h6>
                  </div>
                </template>
              </v-data-table>
            </div>
          </v-card>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="upsertDialog" max-width="450">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>{{ isEdit ? '編輯顧問師' : '新增顧問師' }}</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" icon="close" @click="closeUpsertDialog"></v-btn>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="formValid">
          <p>顧問師類別</p>
          <v-text-field
            v-model="selectedCategory.name"
            label="類別"
            :rules="[rules.required]"
            disabled
          ></v-text-field>

          <p>綁定小芋頭帳號</p>
          <v-autocomplete
            v-model="selectedAccount"
            v-model:search="searchAccount"
            :rules="[rules.required]"
            placeholder="輸入 Email 或名稱搜尋"
            :items="accountOptions"
            :loading="accountLoading"
            item-value="guid"
            item-title="name"
            :custom-filter="() => true"
            :no-data-text="noDataText"
            return-object
            clearable
          >
            <!-- ✅ 選取之後，輸入框裡顯示的 chip 樣式 -->
            <template #chip="{ props, item }">
              <div class="d-flex align-center">
                <span class="font-weight-medium mr-2">
                  {{ itemTitle(item.raw.name) }}
                </span>
                <span class="text-caption text-grey">
                  {{ item.raw.email }}
                </span>
              </div>
            </template>

            <!-- ✅ 下拉選單列表樣式 -->
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #title>
                  <span class="font-weight-medium">
                    {{ itemTitle(item.raw.name) }}
                  </span>
                </template>

                <template #subtitle>
                  <span class="text-caption text-grey">
                    {{ item.raw.email }}
                  </span>
                </template>
              </v-list-item>
            </template>
            <!-- 無資料/載入中顯示狀態 -->
            <template #no-data>
              <div class="text-center pa-4">
                <div v-if="!searchAccount?.trim()">
                  <div class="text-body-2">請輸入 Email 或姓名開始搜尋</div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    例如：amy / amy@email.com
                  </div>
                </div>

                <div v-else-if="accountLoading">
                  <div class="text-body-2">搜尋中…</div>
                </div>

                <div v-else>
                  <img src="/images/NoSearch.svg" alt="no-data" style="max-width: 160px" />
                  <div class="text-body-2 mt-2">查無「{{ searchAccount.trim() }}」的帳號</div>
                </div>
              </div>
            </template>
          </v-autocomplete>

          <v-text-field
            v-model="consultant.name"
            :rules="[rules.required]"
            label="姓名"
          ></v-text-field>

          <v-text-field
            v-model="consultant.email"
            :rules="[rules.required]"
            label="Email"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeUpsertDialog">取消</v-btn>

        <v-btn variant="flat" color="primary" @click="saveConsultant">
          {{ isEdit ? '儲存' : '新增' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import ConsultantCategoryComponent from '@/components/ConsultantCategoryComponent.vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { useProductRules } from '@/utils/rules'

const formRef = ref(null)
const formValid = ref(false)

const rules = useProductRules()
const dialog = useDialogStore()
const upsertDialog = ref(false)
const isEdit = ref(false)

const selectedCategory = ref(null) // ✨ 左邊選到哪個分類
const serverItems = ref([]) // 從後端抓的顧問師列表
const search = ref('')

const selectedAccount = ref()
const searchAccount = ref('')
const accountOptions = ref([])
const accountLoading = ref(false)

const consultant = reactive({
  id: null,
  consultantCategoryId: null,
  accountGuid: '',
  name: '',
  email: '',
})

const headers = [
  { title: '名稱', key: 'name', align: 'start', width: 150 },
  { title: '信箱', key: 'email', align: 'start' },
  { title: '操作', key: 'actions', width: 200, sortable: false },
]

/* 搜尋帳號 */
let searchTimer = null
let currentRequest = null

const noDataText = computed(() => {
  const q = (searchAccount.value || '').trim()
  if (!q) return '請輸入 Email 或姓名開始搜尋'

  if (accountLoading.value) return '搜尋中…'
  return `查無「${q}」的帳號`
})

//沒有名稱判別
const itemTitle = (name) => (name && name.trim() !== '' ? name : '無名稱')
watch(searchAccount, (val) => {
  if (!val) {
    if (searchTimer) clearTimeout(searchTimer)
    accountOptions.value = []
    return
  }

  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchAccount(val.trim())
  }, 300)
})

/* 抓取資料 */
async function fetchAccount(search) {
  try {
    accountLoading.value = true

    if (currentRequest) {
      currentRequest.abort()
    }

    currentRequest = new AbortController()

    const { data } = await api.get(`/Account/Filter`, {
      params: { search },
      signal: currentRequest.signal,
    })
    accountOptions.value = data ?? []
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
    accountOptions.value = []
  } finally {
    accountLoading.value = false
  }
}

async function fetchData(id) {
  dialog.showLoading()
  try {
    const { data } = await api.get(`/Consultant/GetByCategoryId/${id}`)
    serverItems.value = data ?? []
  } catch (err) {
    dialog.showAxiosError(err, '讀取管理者列表失敗')
  } finally {
    dialog.hideLoading()
  }
}

watch(selectedAccount, (val) => {
  if (!val) {
    consultant.accountGuid = ''
    consultant.name = ''
    consultant.email = ''
    return
  }

  consultant.accountGuid = val.guid
  consultant.name = val.name ?? ''
  consultant.email = val.email ?? ''
})

/* UpsertDialog控制 */
async function openEdit(id) {
  try {
    dialog.showLoading()
    const { data } = await api.get(`/Consultant/${id}`)

    // 把後端資料塞進 consultant
    consultant.id = data.id
    consultant.consultantCategoryId = data.consultantCategoryId
    consultant.accountGuid = data.accountGuid
    consultant.name = data.name
    consultant.email = data.email

    // 若要讓 autocomplete 顯示已選帳號，可以把 selectedAccount 也設起來
    selectedAccount.value = {
      guid: data.accountGuid,
      name: data.name,
      email: data.email,
    }

    isEdit.value = true
    upsertDialog.value = true
  } catch (err) {
    dialog.showAxiosError(err, '讀取顧問師失敗')
  } finally {
    dialog.hideLoading()
  }
}

function openCreate() {
  if (!selectedCategory.value?.id) {
    dialog.showError('操作錯誤', '請先選取左邊類別在新增')
    return
  }
  // 重置 consultant
  consultant.id = null
  consultant.consultantCategoryId = selectedCategory.value.id
  consultant.accountGuid = ''
  consultant.name = ''
  consultant.email = ''

  selectedAccount.value = null
  searchAccount.value = ''
  accountOptions.value = []

  isEdit.value = false
  upsertDialog.value = true
}

function closeUpsertDialog() {
  upsertDialog.value = false
  isEdit.value = false

  selectedAccount.value = null
  searchAccount.value = ''
  accountOptions.value = []

  consultant.id = null
  consultant.consultantCategoryId = null
  consultant.accountGuid = ''
  consultant.name = ''
  consultant.email = ''

  formRef.value?.resetValidation()
}

watch(selectedCategory, async (category) => {
  if (!category?.id) {
    return
  }

  await fetchData(category?.id)
})

/* 新增 編輯  刪除 */
async function saveConsultant() {
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  try {
    const payload = {
      consultantCategoryId: consultant.consultantCategoryId,
      accountGuid: consultant.accountGuid,
      name: consultant.name,
      email: consultant.email,
    }

    if (isEdit.value && consultant.id) {
      await api.put(`/Consultant/${consultant.id}`, payload)
    } else {
      await api.post('/Consultant', payload)
    }

    await fetchData(selectedCategory.value.id)
    closeUpsertDialog()
  } catch (err) {
    dialog.showAxiosError(err, isEdit.value ? '資料編輯失敗' : '資料新增失敗')
  }
}

async function confirmDelete(id) {
  if (!id) return

  const ok = await dialog.askConfirm({
    title: '刪除顧問師',
    message: '確定要刪除這個顧問師嗎？',
    isDelete: true,
  })
  if (!ok) return

  try {
    dialog.showLoading()
    await api.delete(`/Consultant/${id}`)

    if (selectedCategory.value?.id) {
      await fetchData(selectedCategory.value.id)
    }
  } catch (err) {
    dialog.showAxiosError(err, '刪除顧問師失敗')
  } finally {
    dialog.hideLoading()
  }
}
</script>
