<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h5 font-weight-bold primary--text d-flex align-center ga-2">
          <v-icon color="primary">gavel</v-icon>
          <span>所得稅與二代健保設定</span>
        </h2>
        <p class="text-subtitle-2 text-grey-darken-1">
          管理系統級稅率與基本薪資門檻，並可批次勾選修改代理商與外部會員之法人帳戶、工會投保狀態。
        </p>
      </div>
    </div>

    <!-- 系統設定區塊 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card border flat class="pa-6">
          <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center ga-2">
            <v-icon color="indigo">settings</v-icon>
            <span>系統稅費率參數設定</span>
          </div>
          <v-row class="align-center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="systemSettings.taxRate"
                label="代扣所得稅率 (%)"
                type="number"
                min="0"
                max="100"
                variant="outlined"
                density="comfortable"
                hide-details
                prefix="%"
                color="indigo"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="systemSettings.basicSalaryThreshold"
                label="二代健保基本薪資級距門檻 (NTD)"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                hide-details
                prefix="NT$"
                color="indigo"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="text-right">
              <v-btn
                color="indigo"
                variant="flat"
                prepend-icon="save"
                size="large"
                :loading="saveSettingsLoading"
                @click="saveSystemSettings"
                block
              >
                儲存系統設定
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- 頁籤與資料表格 -->
    <v-card border flat>
      <v-tabs v-model="activeTab" bg-color="indigo-lighten-5" color="indigo" align-tabs="start">
        <v-tab value="agents" class="font-weight-bold">
          <v-icon start>store</v-icon>
          代理商狀態管理
        </v-tab>
        <v-tab value="external" class="font-weight-bold">
          <v-icon start>handshake</v-icon>
          外部會員 (乙方) 狀態管理
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab" :transition="false" :reverse-transition="false">
        <!-- 代理商 (星代) 設定 -->
        <v-window-item value="agents">
          <v-card flat class="pa-4">
            <!-- 搜尋與批次操作工具列 -->
            <v-row class="align-center mb-4">
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="agentSearch"
                  label="搜尋代理商姓名、Email、中心名稱"
                  prepend-inner-icon="search"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="8" class="d-flex justify-sm-end ga-2 flex-wrap">
                <v-fade-transition>
                  <div v-if="selectedAgents.length > 0" class="d-flex align-center ga-2">
                    <span class="text-caption text-grey-darken-1 mr-2">
                      已選擇 {{ selectedAgents.length }} 筆
                    </span>
                    <v-btn
                      color="indigo"
                      variant="tonal"
                      size="small"
                      prepend-icon="business"
                      :loading="batchAgentLoading"
                      @click="batchUpdateAgents('IsCorporate', true)"
                    >
                      設為法人
                    </v-btn>
                    <v-btn
                      color="indigo"
                      variant="outlined"
                      size="small"
                      prepend-icon="domain_disabled"
                      :loading="batchAgentLoading"
                      @click="batchUpdateAgents('IsCorporate', false)"
                    >
                      取消法人
                    </v-btn>
                    <v-btn
                      color="teal"
                      variant="tonal"
                      size="small"
                      prepend-icon="verified"
                      :loading="batchAgentLoading"
                      @click="batchUpdateAgents('IsUnionInsured', true)"
                    >
                      設為已投保工會
                    </v-btn>
                    <v-btn
                      color="teal"
                      variant="outlined"
                      size="small"
                      prepend-icon="remove_moderator"
                      :loading="batchAgentLoading"
                      @click="batchUpdateAgents('IsUnionInsured', false)"
                    >
                      取消已投保工會
                    </v-btn>
                  </div>
                </v-fade-transition>
                <v-btn
                  color="default"
                  variant="outlined"
                  icon="refresh"
                  density="comfortable"
                  :loading="agentsLoading"
                  @click="fetchAgents"
                ></v-btn>
              </v-col>
            </v-row>

            <!-- 代理商資料表 -->
            <v-data-table
              v-model="selectedAgents"
              :headers="agentHeaders"
              :items="filteredAgents"
              :loading="agentsLoading"
              item-value="accountGuid"
              show-select
              hover
              class="border rounded"
            >
              <!-- 狀態欄位 -->
              <template #[`item.isCorporate`]="{ item }">
                <v-switch
                  v-model="item.isCorporate"
                  color="indigo"
                  hide-details
                  density="compact"
                  @update:model-value="toggleSingleAgent(item, 'IsCorporate', item.isCorporate)"
                >
                  <template #label>
                    <v-chip
                      :color="item.isCorporate ? 'indigo' : 'default'"
                      size="x-small"
                      variant="flat"
                    >
                      {{ item.isCorporate ? '法人' : '個人' }}
                    </v-chip>
                  </template>
                </v-switch>
              </template>

              <template #[`item.isUnionInsured`]="{ item }">
                <v-switch
                  v-model="item.isUnionInsured"
                  color="teal"
                  hide-details
                  density="compact"
                  @update:model-value="
                    toggleSingleAgent(item, 'IsUnionInsured', item.isUnionInsured)
                  "
                >
                  <template #label>
                    <v-chip
                      :color="item.isUnionInsured ? 'teal' : 'default'"
                      size="x-small"
                      variant="flat"
                    >
                      {{ item.isUnionInsured ? '工會加保' : '一般健保' }}
                    </v-chip>
                  </template>
                </v-switch>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <!-- 外部會員 (乙方) 設定 -->
        <v-window-item value="external">
          <v-card flat class="pa-4">
            <!-- 搜尋與批次操作工具列 -->
            <v-row class="align-center mb-4">
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="externalSearch"
                  label="搜尋外部會員姓名、Email、電話"
                  prepend-inner-icon="search"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="8" class="d-flex justify-sm-end ga-2 flex-wrap">
                <v-fade-transition>
                  <div v-if="selectedExternal.length > 0" class="d-flex align-center ga-2">
                    <span class="text-caption text-grey-darken-1 mr-2">
                      已選擇 {{ selectedExternal.length }} 筆
                    </span>
                    <v-btn
                      color="indigo"
                      variant="tonal"
                      size="small"
                      prepend-icon="business"
                      :loading="batchExternalLoading"
                      @click="batchUpdateExternal('IsCorporate', true)"
                    >
                      設為法人
                    </v-btn>
                    <v-btn
                      color="indigo"
                      variant="outlined"
                      size="small"
                      prepend-icon="domain_disabled"
                      :loading="batchExternalLoading"
                      @click="batchUpdateExternal('IsCorporate', false)"
                    >
                      取消法人
                    </v-btn>
                    <v-btn
                      color="teal"
                      variant="tonal"
                      size="small"
                      prepend-icon="verified"
                      :loading="batchExternalLoading"
                      @click="batchUpdateExternal('IsUnionInsured', true)"
                    >
                      設為已投保工會
                    </v-btn>
                    <v-btn
                      color="teal"
                      variant="outlined"
                      size="small"
                      prepend-icon="remove_moderator"
                      :loading="batchExternalLoading"
                      @click="batchUpdateExternal('IsUnionInsured', false)"
                    >
                      取消已投保工會
                    </v-btn>
                  </div>
                </v-fade-transition>
                <v-btn
                  color="default"
                  variant="outlined"
                  icon="refresh"
                  density="comfortable"
                  :loading="externalLoading"
                  @click="fetchExternal"
                ></v-btn>
              </v-col>
            </v-row>

            <!-- 外部會員資料表 -->
            <v-data-table
              v-model="selectedExternal"
              :headers="externalHeaders"
              :items="filteredExternal"
              :loading="externalLoading"
              item-value="id"
              show-select
              hover
              class="border rounded"
            >
              <!-- 狀態欄位 -->
              <template #[`item.isCorporate`]="{ item }">
                <v-switch
                  v-model="item.isCorporate"
                  color="indigo"
                  hide-details
                  density="compact"
                  @update:model-value="toggleSingleExternal(item, 'IsCorporate', item.isCorporate)"
                >
                  <template #label>
                    <v-chip
                      :color="item.isCorporate ? 'indigo' : 'default'"
                      size="x-small"
                      variant="flat"
                    >
                      {{ item.isCorporate ? '法人' : '個人' }}
                    </v-chip>
                  </template>
                </v-switch>
              </template>

              <template #[`item.isUnionInsured`]="{ item }">
                <v-switch
                  v-model="item.isUnionInsured"
                  color="teal"
                  hide-details
                  density="compact"
                  @update:model-value="
                    toggleSingleExternal(item, 'IsUnionInsured', item.isUnionInsured)
                  "
                >
                  <template #label>
                    <v-chip
                      :color="item.isUnionInsured ? 'teal' : 'default'"
                      size="x-small"
                      variant="flat"
                    >
                      {{ item.isUnionInsured ? '工會加保' : '一般健保' }}
                    </v-chip>
                  </template>
                </v-switch>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'

const dialog = useDialogStore()

// System setting fields
const systemSettings = ref({
  taxRate: '5',
  basicSalaryThreshold: '29500',
})
const saveSettingsLoading = ref(false)

// Tab state
const activeTab = ref('agents')

// Agents (星代) state
const agents = ref([])
const selectedAgents = ref([])
const agentSearch = ref('')
const agentsLoading = ref(false)
const batchAgentLoading = ref(false)

const agentHeaders = [
  { title: '單位/中心名稱', key: 'unitName', sortable: true },
  { title: '姓名', key: 'name', sortable: true },
  { title: '代理商位階', key: 'gradeName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: '是否為法人帳戶 (不扣二代健保)', key: 'isCorporate', width: '220px', sortable: false },
  {
    title: '是否已投保職業工會 (不扣二代健保)',
    key: 'isUnionInsured',
    width: '220px',
    sortable: false,
  },
]

// External members (乙方) state
const external = ref([])
const selectedExternal = ref([])
const externalSearch = ref('')
const externalLoading = ref(false)
const batchExternalLoading = ref(false)

const externalHeaders = [
  { title: '姓名', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: '電話', key: 'phone', sortable: true },
  { title: '銀行帳號', key: 'bankAccount', sortable: false },
  { title: '是否為法人帳戶 (不扣二代健保)', key: 'isCorporate', width: '220px', sortable: false },
  {
    title: '是否已投保職業工會 (不扣二代健保)',
    key: 'isUnionInsured',
    width: '220px',
    sortable: false,
  },
]

// Filter computed properties
const filteredAgents = computed(() => {
  if (!agentSearch.value) return agents.value
  const q = agentSearch.value.toLowerCase()
  return agents.value.filter(
    (a) =>
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.unitName && a.unitName.toLowerCase().includes(q)) ||
      (a.gradeName && a.gradeName.toLowerCase().includes(q)),
  )
})

const filteredExternal = computed(() => {
  if (!externalSearch.value) return external.value
  const q = externalSearch.value.toLowerCase()
  return external.value.filter(
    (e) =>
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.phone && e.phone.toLowerCase().includes(q)),
  )
})

// Lifecycle
onMounted(async () => {
  await fetchSystemSettings()
  await fetchAgents()
})

// Watch activeTab to load data lazily after the tab switch transition completes
let fetchTimeout = null
watch(activeTab, (newTab) => {
  if (fetchTimeout) clearTimeout(fetchTimeout)
  fetchTimeout = setTimeout(() => {
    if (newTab === 'agents') {
      fetchAgents()
    } else if (newTab === 'external') {
      fetchExternal()
    }
  }, 150)
})

// Methods: Fetching data
async function fetchSystemSettings() {
  try {
    const res = await api.get('/Commission/system-settings')
    if (Array.isArray(res.data)) {
      const trSetting = res.data.find((s) => s.settingKey === 'TaxRate')
      const thSetting = res.data.find((s) => s.settingKey === 'BasicSalaryThreshold')
      if (trSetting) systemSettings.value.taxRate = trSetting.settingValue
      if (thSetting) systemSettings.value.basicSalaryThreshold = thSetting.settingValue
    }
  } catch (err) {
    console.error('Failed to load system settings:', err)
    dialog.showAxiosError(err, '載入系統設定失敗')
  }
}

async function fetchAgents() {
  agentsLoading.value = true
  try {
    const res = await api.get('/Commission/agent-settings')
    agents.value = res.data || []
    selectedAgents.value = []
  } catch (err) {
    console.error('Failed to load agents:', err)
    dialog.showAxiosError(err, '載入代理商列表失敗')
  } finally {
    agentsLoading.value = false
  }
}

async function fetchExternal() {
  externalLoading.value = true
  try {
    const res = await api.get('/Commission/external-member-settings')
    external.value = res.data || []
    selectedExternal.value = []
  } catch (err) {
    console.error('Failed to load external members:', err)
    dialog.showAxiosError(err, '載入外部會員列表失敗')
  } finally {
    externalLoading.value = false
  }
}

// Save system setting parameters
async function saveSystemSettings() {
  saveSettingsLoading.value = true
  try {
    await api.post('/Commission/system-settings', {
      taxRate: systemSettings.value.taxRate,
      basicSalaryThreshold: systemSettings.value.basicSalaryThreshold,
    })
    dialog.showSuccess('儲存成功', '系統參數已順利更新。')
  } catch (err) {
    console.error('Failed to save settings:', err)
    dialog.showAxiosError(err, '儲存系統設定失敗')
  } finally {
    saveSettingsLoading.value = false
  }
}

// Single agent toggle
async function toggleSingleAgent(item, field, val) {
  try {
    await api.post('/Commission/batch-update-agent-settings', {
      accountGuids: [item.accountGuid],
      [field.charAt(0).toLowerCase() + field.slice(1)]: val,
      field: field,
    })
  } catch (err) {
    console.error('Failed to update agent:', err)
    dialog.showAxiosError(err, '更新代理商設定失敗')
    // Revert UI status on failure
    item[field.charAt(0).toLowerCase() + field.slice(1)] = !val
  }
}

// Batch agent update
async function batchUpdateAgents(field, val) {
  if (selectedAgents.value.length === 0) return
  batchAgentLoading.value = true
  try {
    await api.post('/Commission/batch-update-agent-settings', {
      accountGuids: selectedAgents.value,
      [field.charAt(0).toLowerCase() + field.slice(1)]: val,
      field: field,
    })
    dialog.showSuccess(
      '批次設定成功',
      `已成功將所選的 ${selectedAgents.value.length} 位代理商進行更新。`,
    )
    await fetchAgents()
  } catch (err) {
    console.error('Batch update agents failed:', err)
    dialog.showAxiosError(err, '批次設定代理商失敗')
  } finally {
    batchAgentLoading.value = false
  }
}

// Single external member toggle
async function toggleSingleExternal(item, field, val) {
  try {
    await api.post('/Commission/batch-update-external-member-settings', {
      ids: [item.id],
      [field.charAt(0).toLowerCase() + field.slice(1)]: val,
      field: field,
    })
  } catch (err) {
    console.error('Failed to update external member:', err)
    dialog.showAxiosError(err, '更新外部會員設定失敗')
    // Revert UI status on failure
    item[field.charAt(0).toLowerCase() + field.slice(1)] = !val
  }
}

// Batch external member update
async function batchUpdateExternal(field, val) {
  if (selectedExternal.value.length === 0) return
  batchExternalLoading.value = true
  try {
    await api.post('/Commission/batch-update-external-member-settings', {
      ids: selectedExternal.value,
      [field.charAt(0).toLowerCase() + field.slice(1)]: val,
      field: field,
    })
    dialog.showSuccess(
      '批次設定成功',
      `已成功將所選的 ${selectedExternal.value.length} 位外部會員進行更新。`,
    )
    await fetchExternal()
  } catch (err) {
    console.error('Batch update external members failed:', err)
    dialog.showAxiosError(err, '批次設定外部會員失敗')
  } finally {
    batchExternalLoading.value = false
  }
}
</script>

<style scoped>
.v-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
