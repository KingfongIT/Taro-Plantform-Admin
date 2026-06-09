<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h5 font-weight-bold primary--text d-flex align-center ga-2">
          <v-icon color="primary">settings_applications</v-icon>
          <span>管理費人員設定</span>
        </h2>
        <p class="text-subtitle-2 text-grey-darken-1">
          管理 MFYC (管理費) 與 UFYC (使用費管理) 的設定人員、職稱以及分配比例。
        </p>
      </div>
    </div>

    <!-- 系統版本資訊與操作區 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card border flat class="pa-4 bg-grey-lighten-4">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="d-flex align-center ga-3 flex-wrap">
              <span class="text-subtitle-1 font-weight-bold text-grey-darken-4">管理費人員全域設定 (最新計算基準)</span>
              <v-chip v-if="activeVersion" color="indigo" variant="flat" class="font-weight-bold">
                目前版本: {{ activeVersion.versionName }}
              </v-chip>
              <span v-if="activeVersion" class="text-caption text-grey-darken-2">
                更新時間: {{ formatDate(activeVersion.createdAt) }} | 經辦人: {{ activeVersion.operatorAccountId || '系統' }}
              </span>
              <v-chip color="deep-purple-darken-2" variant="flat"  class="font-weight-bold ml-2">
                MFYC 總比例: {{ totalMfycPct }}%
              </v-chip>
              <v-chip color="indigo-darken-2" variant="flat"  class="font-weight-bold ml-2">
                UFYC 總比例: {{ totalUfycPct }}%
              </v-chip>
            </div>
            <div>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="add"
                @click="openCreateMgmtSettingDialog"
              >
                新增人員設定
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 設定人員清單表格 -->
    <v-row>
      <v-col cols="12">
        <v-card border flat>
          <v-data-table
            :headers="mgmtSettingsHeaders"
            :items="mgmtSettingsList"
            :loading="mgmtSettingsLoading"
            class="elevation-0"
            no-data-text="暫無管理費設定人員"
          >
            <template #item.projectName="{ item }">
              <v-chip size="small" :color="item.projectName === 'MFYC' ? 'deep-purple' : 'indigo'" variant="tonal">
                {{ item.projectName === 'MFYC' ? '管理費 MFYC' : '使用費管理 UFYC' }}
              </v-chip>
            </template>
            <template #item.percentage="{ item }">
              <span class="font-weight-bold">{{ item.percentage }}%</span>
            </template>
            <template #item.actions="{ item, index }">
              <v-btn
                variant="tonal"
                color="primary"
                class="mr-2 font-weight-bold"
                @click="openEditMgmtSettingDialog(item, index)"
              >
                編輯
              </v-btn>
              <v-btn
                variant="tonal"
                color="error"
                class="font-weight-bold"
                @click="confirmDeleteMgmtSetting(item, index)"
              >
                刪除
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- 管理費人員全域設定 CRUD Dialog -->
    <v-dialog v-model="mgmtSettingDialog" max-width="600" persistent>
      <v-card class="pa-2">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary">{{ mgmtSettingFormMode === 'create' ? 'add_circle' : 'edit' }}</v-icon>
            <span>{{ mgmtSettingFormMode === 'create' ? '新增管理費人員設定' : '編輯管理費人員設定' }}</span>
          </div>
          <v-btn icon="close" variant="text" @click="mgmtSettingDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-4">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="mgmtSettingForm.projectName"
                :items="[
                  { title: '管理費 MFYC', value: 'MFYC' },
                  { title: '使用費管理 UFYC', value: 'UFYC' }
                ]"
                item-title="title"
                item-value="value"
                label="費用類別"
                variant="outlined"
                density="comfortable"
                :disabled="mgmtSettingFormMode === 'edit'"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="mgmtSettingForm.jobTitle"
                label="職稱"
                variant="outlined"
                density="comfortable"
                placeholder="e.g. 集團董事長"
              ></v-text-field>
            </v-col>
            
            <!-- 新增模式：搜尋選取人員 -->
            <v-col cols="12" v-if="mgmtSettingFormMode === 'create'">
              <v-autocomplete
                v-model="selectedSearchUser"
                v-model:search="userSearchQuery"
                :items="userSearchItems"
                :loading="userSearchLoading"
                item-value="accountGuid"
                item-title="email"
                placeholder="輸入姓名或 Email 搜尋"
                label="搜尋人員"
                variant="outlined"
                density="comfortable"
                hide-no-data
                hide-details
                :custom-filter="() => true"
                @update:search="onSearchInput"
                @update:modelValue="onPickSearchUser"
                return-object
              >
                <!-- 下拉選單列表樣式 -->
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #title>
                      <span class="font-weight-medium text-body-2">
                        暱稱: {{ item.raw.profileName || '無' }} | 實名: {{ item.raw.contractRealName || '無' }}
                      </span>
                    </template>
                    <template #subtitle>
                      <span class="text-caption text-grey">
                        {{ item.raw.email }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- 唯讀顯示姓名與 Email -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="mgmtSettingForm.name"
                label="姓名"
                variant="outlined"
                density="comfortable"
                disabled
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="mgmtSettingForm.email"
                label="Email"
                variant="outlined"
                density="comfortable"
                disabled
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="mgmtSettingForm.percentage"
                label="分配比例 (%)"
                type="number"
                variant="outlined"
                density="comfortable"
                suffix="%"
                required
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="d-flex justify-end ga-2">
          <v-btn color="grey-darken-1" variant="outlined" @click="mgmtSettingDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveMgmtSettingForm">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'

const dialog = useDialogStore()

// 管理費人員全域設定 CRUD 狀態與版本資訊
const mgmtSettingDialog = ref(false)
const mgmtSettingFormMode = ref('create')
const editIndex = ref(-1)
const mgmtSettingForm = ref({
  projectName: 'MFYC',
  jobTitle: '',
  name: '',
  email: '',
  percentage: 0
})

const selectedSearchUser = ref(null)
const userSearchQuery = ref('')
const userSearchLoading = ref(false)
const userSearchItems = ref([])

const activeVersion = ref(null)
const mgmtSettingsList = ref([])
const mgmtSettingsLoading = ref(false)

const mgmtSettingsHeaders = [
  { title: '費用類別', key: 'projectName', width: 150 },
  { title: '職稱', key: 'jobTitle', width: 180 },
  { title: '姓名', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: '分配比例 (%)', key: 'percentage', align: 'end', width: 150 },
  { title: '操作', key: 'actions', sortable: false, width: 180 }
]

const totalMfycPct = computed(() => {
  const sum = mgmtSettingsList.value
    .filter(item => item.projectName === 'MFYC')
    .reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0)
  return parseFloat(sum.toFixed(2))
})

const totalUfycPct = computed(() => {
  const sum = mgmtSettingsList.value
    .filter(item => item.projectName === 'UFYC')
    .reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0)
  return parseFloat(sum.toFixed(2))
})

function openCreateMgmtSettingDialog() {
  mgmtSettingFormMode.value = 'create'
  mgmtSettingForm.value = {
    projectName: 'MFYC',
    jobTitle: '',
    name: '',
    email: '',
    percentage: 0
  }
  selectedSearchUser.value = null
  userSearchQuery.value = ''
  userSearchItems.value = []
  mgmtSettingDialog.value = true
}

function openEditMgmtSettingDialog(item, index) {
  mgmtSettingFormMode.value = 'edit'
  editIndex.value = index
  mgmtSettingForm.value = {
    projectName: item.projectName,
    jobTitle: item.jobTitle,
    name: item.name,
    email: item.email,
    percentage: item.percentage
  }
  mgmtSettingDialog.value = true
}

let searchTimeout = null
function onSearchInput(val) {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchUsers(val)
  }, 350)
}

async function searchUsers(keyword) {
  if (!keyword || !keyword.trim()) {
    userSearchItems.value = []
    return
  }
  userSearchLoading.value = true
  try {
    const res = await api.get('/Commission/search-users', {
      params: { keyword }
    })
    userSearchItems.value = res.data || []
  } catch (err) {
    console.error('Failed to search users:', err)
  } finally {
    userSearchLoading.value = false
  }
}

function onPickSearchUser(user) {
  if (user) {
    mgmtSettingForm.value.name = user.contractRealName || user.profileName || '無姓名'
    mgmtSettingForm.value.email = user.email || ''
  }
}

async function saveMgmtSettingForm() {
  if (!mgmtSettingForm.value.name) {
    dialog.showError('錯誤', '請選擇設定人員')
    return
  }
  const pct = parseFloat(mgmtSettingForm.value.percentage)
  if (isNaN(pct) || pct <= 0 || pct > 100) {
    dialog.showError('錯誤', '分配比例必須大於 0% 且小於等於 100%')
    return
  }

  const updatedList = [...mgmtSettingsList.value]
  const newItem = {
    projectName: mgmtSettingForm.value.projectName,
    jobTitle: mgmtSettingForm.value.jobTitle,
    name: mgmtSettingForm.value.name,
    email: mgmtSettingForm.value.email,
    percentage: pct
  }

  if (mgmtSettingFormMode.value === 'create') {
    updatedList.push(newItem)
  } else if (editIndex.value > -1) {
    updatedList[editIndex.value] = newItem
  }

  await saveActiveSettings(updatedList)
}

async function confirmDeleteMgmtSetting(item, index) {
  const confirm = await dialog.askConfirm({
    title: '刪除確認',
    message: `您確定要將「${item.name}」從管理費人員設定中移除嗎？\n這將在儲存後產生新的設定版本。`
  })
  if (!confirm) return

  const updatedList = mgmtSettingsList.value.filter((_, idx) => idx !== index)
  await saveActiveSettings(updatedList)
}

async function saveActiveSettings(newList) {
  dialog.showLoading()
  try {
    const payload = newList.map(item => ({
      projectName: item.projectName,
      jobTitle: item.jobTitle,
      name: item.name,
      email: item.email,
      percentage: item.percentage
    }))
    await api.put('/ManagementFee/active-settings', payload)
    dialog.showSuccess('儲存成功', '已更新管理費全域設定並建立新版本')
    mgmtSettingDialog.value = false
    await fetchMgmtSettings()
  } catch (err) {
    console.error('Failed to update active settings:', err)
    dialog.showError('儲存失敗', err.response?.data?.message || '更新管理費設定失敗')
  } finally {
    dialog.hideLoading()
  }
}

async function fetchMgmtSettings() {
  mgmtSettingsLoading.value = true
  try {
    const res = await api.get('/ManagementFee/versions')
    const versions = res.data || []
    const active = versions.find(v => v.isActive)
    if (active) {
      activeVersion.value = active
      mgmtSettingsList.value = active.settings || []
    } else {
      activeVersion.value = null
      mgmtSettingsList.value = []
    }
  } catch (err) {
    console.error('Failed to fetch management fee settings:', err)
  } finally {
    mgmtSettingsLoading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

onMounted(async () => {
  await fetchMgmtSettings()
})
</script>

<style scoped>
.ga-2 {
  gap: 8px;
}
.ga-3 {
  gap: 12px;
}
</style>
