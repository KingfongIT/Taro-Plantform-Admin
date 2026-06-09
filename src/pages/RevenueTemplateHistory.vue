<template>
  <div class="page-wrapper">
    <v-container class="pb-0">
      <div class="main-title d-flex justify-space-between">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-btn
              :width="100"
              class="mr-4"
              prepend-icon="arrow_back"
              variant="tonal"
              :to="{ name: 'RevenueTemplate' }"
              >返回</v-btn
            >
            <h2>商品分佣模板內容</h2>
          </div>
        </div>
      </div>
    </v-container>
    <div style="background-color: #f5f5f5; height: 100vh">
      <v-container>
        <v-card>
          <v-card-title class="d-flex align-center">
            <span class="mr-4">紀錄</span>

            <!-- 顏色說明 legend -->
            <div class="d-flex align-center" style="gap: 12px">
              <div class="d-flex align-center" style="gap: 6px">
                <v-chip size="small" color="primary" variant="tonal" />
                <span class="text-caption">百分比（%）</span>
              </div>

              <div class="d-flex align-center" style="gap: 6px">
                <v-chip size="small" color="amber" variant="tonal" />
                <span class="text-caption">固定數值</span>
              </div>
            </div>

            <v-spacer />

            <v-btn variant="flat" color="primary" @click="openEdit = true"> 編輯 </v-btn>
          </v-card-title>

          <v-data-table :items="serverItems" :headers="headers" :loading="loading" hover>
            <!-- 行政費 -->
            <template #item.adminFeeValue="{ item }">
              <v-chip size="small" :color="getFeeChipColor(item.adminFeeType)" variant="tonal">
                {{ formatFeeValue(item.adminFeeType, item.adminFeeValue) }}
              </v-chip>
            </template>

            <!-- 公司分潤 -->
            <template #item.companyValue="{ item }">
              {{ item.companyValue != null ? `${item.companyValue}%` : '-' }}
            </template>

            <!-- 是否分潤 -->
            <template #item.isRevenueShare="{ item }">
              <v-icon v-if="item.isRevenueShare" size="small" color="success"> check </v-icon>
            </template>

            <!-- 管理費 -->
            <template #item.managementFeeValue="{ item }">
              <v-chip size="small" :color="getFeeChipColor(item.managementFeeType)" variant="tonal">
                {{ formatFeeValue(item.managementFeeType, item.managementFeeValue) }}
              </v-chip>
            </template>

            <!-- 使用費 -->
            <template #item.usageFeeValue="{ item }">
              <v-chip size="small" :color="getFeeChipColor(item.usageFeeType)" variant="tonal">
                {{ formatFeeValue(item.usageFeeType, item.usageFeeValue) }}
              </v-chip>
            </template>

            <!-- 顧問費 -->
            <template #item.consultantValue="{ item }">
              <v-chip size="small" :color="getFeeChipColor(item.consultantType)" variant="tonal">
                {{ formatFeeValue(item.consultantType, item.consultantValue) }}
              </v-chip>
            </template>

            <!-- 講師費 -->
            <template #item.lecturerValue="{ item }">
              <v-chip size="small" :color="getFeeChipColor(item.lecturerType)" variant="tonal">
                {{ formatFeeValue(item.lecturerType, item.lecturerValue) }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-container>
    </div>
  </div>
  <v-navigation-drawer v-model="openEdit" location="right" temporary :width="680" persistent class="scrollable-body-drawer">
    <div class="d-flex flex-column h-100">
      <v-toolbar color="white" class="flex-grow-0 flex-shrink-0">
        <v-toolbar-title class="font-weight-medium">規格內容</v-toolbar-title>
        <v-spacer />
        <!-- <v-btn icon variant="text" @click="openEdit = false">
          <v-icon>close</v-icon>
        </v-btn> -->
      </v-toolbar>
      <v-form ref="form" v-model="isValid" @submit.prevent="edit(props.id)" class="d-flex flex-column flex-grow-1 overflow-hidden">
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
                  :suffix="'%'"
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
          <v-btn variant="text" class="mr-2 flex-grow-1" @click="openEdit = false">取消</v-btn>
          <v-btn color="primary" variant="flat" class="flex-grow-1" type="submit">儲存</v-btn>
        </v-toolbar>
      </v-form>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import api from '@/plugins/api'
import router from '@/router'
import { useDialogStore } from '@/stores/dialog'
import { useDateFormat } from '@/utils/formatDate'
import { useProductRules } from '@/utils/rules'
import { onMounted, ref } from 'vue'

const props = defineProps({
  id: Number,
})

/* template顏色區分 */
const getFeeChipColor = (type) => {
  return type === 'PERCENT' ? 'info' : 'amber'
}

const formatFeeValue = (type, value) => {
  if (value == null) return '-'
  return type === 'PERCENT' ? `${value}%` : value
}

const dialog = useDialogStore()
const rules = useProductRules()

const serverItems = ref([])
const loading = ref(false)

const isValid = ref(false)
const form = ref(null)
const openEdit = ref(false)

const headers = [
  {
    title: '建立時間',
    key: 'createdAt',
    value: (item) => useDateFormat(item.createdAt, 'YYYY-MM-DD HH:mm'),
  },
  { title: '名稱', key: 'schemeName' },
  {
    title: '行政費',
    key: 'adminFeeValue',
  },
  {
    title: '公司',
    key: 'companyValue',
  },
  { title: '組織', key: 'isRevenueShare' },
  { title: '管理費', key: 'managementFeeValue' },
  { title: '使用費', key: 'usageFeeValue' },
  { title: '顧問師', key: 'consultantValue' },
  { title: '講師', key: 'lecturerValue' },
  { title: '編輯者', key: 'createdBy' },
]

const schema = ref({
  id: null,
  schemeName: '',
  isRevenueShare: false,
  isAdminFee: true,
  adminFeeType: 'PERCENT',
  adminFeeValue: 0,
  companyValue: 0,
  isPartner: false,
  partnerName: 0,
  partnerShareType: 'PERCENT',
  partnerShareValue: 0,
  usageFeeType: 'PERCENT',
  usageFeeValue: 0,
  managementFeeType: 'PERCENT',
  managementFeeValue: 0,
  consultantType: 'PERCENT',
  consultantValue: 0,
  lecturerType: 'PERCENT',
  lecturerValue: 0,
  createdAt: null,
  updatedAt: null,
})

async function fetchData(id) {
  loading.value = true
  try {
    const { data } = await api.get(`/RevenueShareScheme/${id}`)
    schema.value = { ...data }
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    loading.value = false
  }
}

async function fetchHistoryData(id) {
  loading.value = true
  try {
    const { data } = await api.get(`/RevenueShareSchemeHistory/${id}`)
    serverItems.value = data
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    loading.value = false
  }
}

async function edit(id) {
  const result = await form.value?.validate()
  dialog.showLoading()
  try {
    const payload = schema.value
    const { data } = await api.put(`/RevenueShareScheme/${id}`, payload)

    await fetchData(id)
    await fetchHistoryData(id)
    openEdit.value = false
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    dialog.hideLoading()
  }
}

onMounted(async () => {
  await fetchHistoryData(props.id)
  fetchData(props.id)
})
</script>
<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.scrollable-body-drawer :deep(.v-navigation-drawer__content) {
  overflow-y: hidden !important;
}
</style>
