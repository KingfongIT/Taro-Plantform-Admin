<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>商品分潤模板</h2>
    </div>
    <v-card border>
      <v-card-title>
        <v-row>
          <v-col class="d-flex align-center">
            <h3 class="mr-4">全部</h3>
            <v-spacer></v-spacer>
            <v-btn
              class="mr-2"
              prepend-icon="add"
              variant="flat"
              color="primary"
              @click="openAdd = true"
              >新增
            </v-btn>
            <v-text-field
              class="ml-4"
              v-model="search"
              prepend-inner-icon="search"
              label="搜尋名稱"
              hide-details
              density="compact"
              min-width="250"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="serverItems"
        :loading="loading"
        :search="search"
        @click:row="(_, { item }) => onRowClick(item)"
        hover
        style="cursor: pointer"
      >
        <template #item.schemeName="{ item }">
          <span class="text-primary font-weight-medium">{{ item.schemeName }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn variant="text" color="error" icon="delete" @click.stop="deleteData(item.id)"></v-btn>
        </template>
        <template #no-data>
          <div class="text-center pa-6">
            <img src="/images/NoSearch.svg" />
            <h6 class="mt-2">搜尋無結果</h6>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
  <v-navigation-drawer v-model="openAdd" location="right" temporary :width="680" class="scrollable-body-drawer">
    <div class="d-flex flex-column h-100">
      <v-toolbar color="white" class="flex-grow-0 flex-shrink-0">
        <v-toolbar-title class="font-weight-medium">規格內容</v-toolbar-title>
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog()">
          <v-icon>close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-form ref="form" v-model="isValid" @submit.prevent="addTemplate" class="d-flex flex-column flex-grow-1 overflow-hidden">
        <v-container style="background-color: #f5f5f5;" class="flex-grow-1 overflow-y-auto">
        <v-card flat class="mb-3">
          <v-card-title>模板設定</v-card-title>
          <v-card-text>
            <div>
              <p>分潤佣模板名稱</p>
              <v-text-field
                v-model="schema.schemeName"
                :rules="[rules.required]"
                density="comfortable"
                placeholder="名稱"
              ></v-text-field>
            </div>

            <div>
              <v-checkbox
                v-model="schema.isAdminFee"
                label="行政費"
                color="primary"
                @update:model-value="
                  (val) => {
                    if (!val) {
                      schema.adminFeeValue = 0
                      schema.adminFeeType = 'PERCENT'
                    }
                  }
                "
                hide-details
              ></v-checkbox>
              <div class="d-flex">
                <v-select
                  v-model="schema.adminFeeType"
                  :disabled="!schema.isAdminFee"
                  class="mr-3"
                  :items="[
                    { title: '百分比 %', value: 'PERCENT' },
                    { title: '固定金額', value: 'FIXED' },
                  ]"
                  density="comfortable"
                />

                <v-text-field
                  v-model="schema.adminFeeValue"
                  density="comfortable"
                  :disabled="!schema.isAdminFee"
                  :rules="[rules.required, rules.nonNegative]"
                  :suffix="'%'"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <p>公司係數</p>
              <div class="d-flex">
                <v-text-field
                  v-model="schema.companyValue"
                  density="comfortable"
                  :suffix="'%'"
                  :rules="[rules.required, rules.nonNegative]"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <v-checkbox
                v-model="schema.isPartner"
                label="乙方公司"
                color="primary"
                hide-details
                @update:model-value="
                  (val) => {
                    if (!val) {
                      schema.partnerName = ''
                      schema.partnerShareValue = 0
                      schema.partnerShareType = 'PERCENT'
                    }
                  }
                "
              ></v-checkbox>
              <div class="d-flex">
                <v-text-field
                  v-model="schema.partnerName"
                  class="mr-3"
                  density="comfortable"
                  placeholder="乙方名稱"
                  :rules="[(v) => !schema.isPartner || rules.required(v)]"
                  :disabled="!schema.isPartner"
                />
                <v-select
                  v-model="schema.partnerShareType"
                  class="mr-3"
                  :items="[
                    { title: '百分比 %', value: 'PERCENT' },
                    { title: '固定金額', value: 'FIXED' },
                  ]"
                  density="comfortable"
                  :disabled="!schema.isPartner"
                />

                <v-text-field
                  v-model="schema.partnerShareValue"
                  density="comfortable"
                  :suffix="String(schema.partnerShareType || '').trim().toUpperCase() === 'FIXED' ? 'NT$' : '%'"
                  placeholder="0"
                  :rules="[
                    (v) => !schema.isPartner || rules.required(v),
                    (v) => !schema.isPartner || Number(v) >= 0 || '不得為負數',
                  ]"
                  :disabled="!schema.isPartner"
                />
              </div>
            </div>
            <div>
              <v-checkbox
                v-model="schema.isRevenueShare"
                color="primary"
                label="發放組織獎金"
              ></v-checkbox>
            </div>
            <div>
              <p>使用費</p>
              <div class="d-flex">
                <v-select
                  v-model="schema.usageFeeType"
                  class="mr-3"
                  :items="[
                    { title: '百分比 %', value: 'PERCENT' },
                    { title: '固定金額', value: 'FIXED' },
                  ]"
                  density="comfortable"
                />

                <v-text-field
                  v-model="schema.usageFeeValue"
                  density="comfortable"
                  :suffix="'%'"
                  :rules="[rules.required, rules.nonNegative]"
                  placeholder="0"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card flat class="mb-3">
          <v-card-title>商品費用科目</v-card-title>
          <v-card-text>
            <p class="mb-4">依據業績(DFYC)</p>
            <div>
              <p>管理費</p>
              <div class="d-flex">
                <v-select
                  v-model="schema.managementFeeType"
                  class="mr-3"
                  :items="[
                    { title: '百分比 %', value: 'PERCENT' },
                    { title: '固定金額', value: 'FIXED' },
                  ]"
                  density="comfortable"
                />

                <v-text-field
                  v-model="schema.managementFeeValue"
                  density="comfortable"
                  :suffix="'%'"
                  :rules="[rules.required, rules.nonNegative]"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <p>顧問師</p>
              <div class="d-flex">
                <v-select
                  v-model="schema.consultantType"
                  class="mr-3"
                  :items="[
                    { title: '百分比 %', value: 'PERCENT' },
                    { title: '固定金額', value: 'FIXED' },
                  ]"
                  density="comfortable"
                />

                <v-text-field
                  v-model="schema.consultantValue"
                  density="comfortable"
                  :suffix="'%'"
                  :rules="[rules.required, rules.nonNegative]"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <p>講師</p>
              <div class="d-flex">
                <v-select
                  v-model="schema.lecturerType"
                  class="mr-3"
                  :items="[
                    { title: '百分比 %', value: 'PERCENT' },
                    { title: '固定金額', value: 'FIXED' },
                  ]"
                  density="comfortable"
                />

                <v-text-field
                  v-model="schema.lecturerValue"
                  density="comfortable"
                  :suffix="'%'"
                  :rules="[rules.required, rules.nonNegative]"
                  placeholder="0"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
        </v-container>
        <v-toolbar color="white" class="flex-grow-0 flex-shrink-0 d-flex justify-space-between px-4 border-t">
          <v-btn variant="text" class="mr-2" @click="closeDialog()">取消</v-btn>
          <v-btn variant="flat" color="primary" type="submit">新增</v-btn>
        </v-toolbar>
      </v-form>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import api from '@/plugins/api'
import { useProductRules } from '@/utils/rules'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref } from 'vue'
import { useDateFormat } from '@/utils/formatDate'
import { useRouter } from 'vue-router'

const dialog = useDialogStore()
const rules = useProductRules()
const router = useRouter()

const isValid = ref(false)
const form = ref(null)

const openAdd = ref(false)
const serverItems = ref([])
const loading = ref(false)
const search = ref('')

function onRowClick(item) {
  router.push({ name: 'RevenueTemplateHistory', params: { id: item.id } })
}

const headers = [
  { title: '名稱', key: 'schemeName' },
  {
    title: '最後編輯時間',
    key: 'updatedAt',
    value: (item) => useDateFormat(item.updatedAt, 'YYYY-MM-DD HH:mm'),
  },
  {
    title: '建立時間',
    key: 'createAt',
    value: (item) => useDateFormat(item.updatedAt, 'YYYY-MM-DD HH:mm'),
  },
  { title: '最後編輯者', key: 'createBy' },
  { title: '操作', key: 'actions' },
]

const createDefaultSchema = () => ({
  schemeName: '',
  isRevenueShare: false,
  isAdminFee: true,
  adminFeeType: 'PERCENT',
  adminFeeValue: null,
  companyValue: null,
  isPartner: false,
  partnerName: '',
  partnerShareType: 'PERCENT',
  partnerShareValue: null,
  usageFeeType: 'PERCENT',
  usageFeeValue: null,
  managementFeeType: 'PERCENT',
  managementFeeValue: null,
  consultantType: 'PERCENT',
  consultantValue: null,
  lecturerType: 'PERCENT',
  lecturerValue: null,
})

const schema = ref(createDefaultSchema())

function closeDialog() {
  openAdd.value = false
  resetSchema()
}

// 重製schema
function resetSchema() {
  schema.value = createDefaultSchema()
  // 如果有 Vuetify v-form，可以順便清掉驗證
  form.value?.resetValidation?.()
}

async function fetchData() {
  loading.value = true
  try {
    const { data } = await api.get(`/RevenueShareScheme`)
    serverItems.value = data
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    loading.value = false
  }
}

async function addTemplate() {
  const result = await form.value?.validate()
  if (!result || !result.valid) {
    return
  }
  dialog.showLoading()
  try {
    const payload = schema.value
    await api.post(`/RevenueShareScheme`, payload)

    //重製表單
    resetSchema()
    openAdd.value = false

    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '新增失敗')
  } finally {
    dialog.hideLoading()
  }
}

async function deleteData(id) {
  const ok = await dialog.askConfirm({
    title: '刪除商品分潤模板',
    message: '確定要刪除這個刪除商品分潤模板嗎？',
    isDelete: true,
  })
  if (!ok) return
  dialog.showLoading()
  try {
    await api.delete(`/RevenueShareScheme/${id}`)
    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '刪除失敗')
  } finally {
    dialog.hideLoading()
  }
}

onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
.scrollable-body-drawer :deep(.v-navigation-drawer__content) {
  overflow-y: hidden !important;
}
</style>
