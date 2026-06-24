<template>
  <v-container>
    <div class="main-title">
      <h2>商品管理</h2>
      <p v-if="!isOffice">
        如需編輯商品排序，請至<RouterLink :to="{ name: 'Category' }" class="link"
          >商品分類</RouterLink
        >中操作。
      </p>
    </div>

    <v-card border>
      <!-- Tab：有效 / 封存 -->
      <v-tabs v-model="isValid" color="primary" grow @update:model-value="onTabChange">
        <v-tab :value="true">有效</v-tab>
        <v-tab :value="false">封存</v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <!-- 工具列 -->
      <v-card-title class="d-flex justify-space-between">
        <div class="d-flex align-center py-2">
          <h3 class="mr-4">全部</h3>
        </div>
        <div class="d-flex align-center">
          <v-btn
            v-if="!isOffice"
            class="ml-4"
            color="primary"
            prepend-icon="add"
            variant="flat"
            :to="{ name: 'ProductCreate' }"
            >新增</v-btn
          >
          <v-text-field
            class="ml-4"
            v-model="search"
            prepend-inner-icon="search"
            label="搜尋名稱、代碼、分類、規格、SKU、分潤模板"
            hide-details
            density="compact"
            clearable
            min-width="420"
          />
        </div>
      </v-card-title>

      <!-- 單一 DataTable（依 tab 切換查詢參數） -->
      <v-data-table
        class="custom-table"
        :headers="headers"
        :items="filteredRows"
        :loading="loading"
        v-model:expanded="expanded"
        :item-value="(item) => item.product.id"
        show-expand
        hover
        @click:row="(_, { item }) => onRowClick(item)"
        style="cursor: pointer"
      >
        <!-- 展開鈕：僅在有規格時顯示 -->
        <template #item.data-table-expand="{ item, internalItem, toggleExpand, isExpanded }">
          <v-btn
            v-if="(item.variants ?? []).length"
            :icon="isExpanded(internalItem) ? 'expand_less' : 'expand_more'"
            size="small"
            color="primary"
            variant="text"
            @click.stop="toggleExpand(internalItem)"
          />
        </template>

        <template #item.product.code="{ item }">
          {{ item.product.code || '-' }}
        </template>

        <template #item.category="{ item }">
          <v-chip
            v-if="item.category"
            :color="categoryColor(item.category.id)"
            size="large"
            variant="flat"
          >
            {{ item.category.name }}
          </v-chip>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <!-- 規格資料夾：展開後顯示該商品底下的規格 -->
        <template #expanded-row="{ columns, item }">
          <tr class="variant-folder-tr">
            <td :colspan="columns.length" class="pa-0">
              <div class="variant-folder">
                <div
                  v-for="v in visibleVariants(item)"
                  :key="v.variantId"
                  class="variant-folder-row"
                  @click.stop="goToVariant(item.product.id, v.variantId)"
                >
                  <v-icon size="small" class="text-medium-emphasis mt-1">
                    subdirectory_arrow_right
                  </v-icon>
                  <div class="variant-folder-main">
                    <v-chip size="small" variant="tonal" color="primary">
                      規格ID：{{ v.variantId }}
                    </v-chip>
                    <v-chip size="small" variant="tonal">SKU：{{ v.sku || '-' }}</v-chip>
                    <v-chip
                      size="small"
                      variant="tonal"
                      :color="v.isActive && v.isPublished ? 'success' : 'grey'"
                    >
                      {{ v.isActive && v.isPublished ? '上架' : '下架' }}
                    </v-chip>
                    <div class="variant-spec-list">
                      <div v-for="(line, i) in specLines(v)" :key="i" class="variant-spec-name">
                        {{ line }}
                      </div>
                      <div
                        v-if="!specLines(v).length"
                        class="variant-spec-name text-medium-emphasis"
                      >
                        無規格名稱
                      </div>
                    </div>
                  </div>
                  <v-spacer />
                  <v-chip
                    size="default"
                    class="align-self-center"
                    :color="schemeColor(v.revenueShareSchemeId)"
                    variant="flat"
                    :disabled="!v.revenueShareSchemeId"
                    @click.stop="openSchemeDrawer(v)"
                  >
                    {{ v.schemeName || '未設定' }}
                  </v-chip>
                </div>
              </div>
            </td>
          </tr>
        </template>

        <template #item.actions="{ item }">
          <div v-if="!isOffice" class="d-flex justify-end ga-1" @click.stop>
            <v-tooltip :text="isValid ? '封存' : '還原'" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon
                  :aria-label="isValid ? '封存' : '還原'"
                  @click="archive(item.product.id)"
                >
                  <v-icon>{{ isValid ? 'archive' : 'unarchive' }}</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip text="刪除" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon
                  color="error"
                  aria-label="刪除"
                  @click="confirmDelete(item.product.id)"
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <div class="text-center pa-6">
            <img src="/images/NoSearch.svg" />
            <h6 class="mt-2">搜尋無結果</h6>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 分潤模板抽屜：變更此規格套用的分潤模板 -->
    <v-navigation-drawer v-model="schemeDrawer.open" location="right" temporary width="480">
      <div class="scheme-drawer">
        <div class="scheme-drawer-header">
          <div class="d-flex align-center mb-2">
            <div class="text-h6 font-weight-bold">變更分潤模板</div>
            <v-spacer />
            <v-btn icon="close" variant="text" size="small" @click="schemeDrawer.open = false" />
          </div>
          <div class="d-flex align-center ga-2 mb-1">
            <v-chip size="small" color="primary" variant="tonal">
              規格ID：{{ schemeDrawer.variantId ?? '-' }}
            </v-chip>
          </div>
          <div
            v-for="(line, i) in schemeDrawer.variantSpecLines"
            :key="i"
            class="text-body-2 scheme-variant-spec"
          >
            {{ line }}
          </div>
        </div>

        <div class="scheme-drawer-body">
          <v-progress-linear v-if="schemeDrawer.loading" indeterminate color="primary" />

          <template v-else>
            <v-select
              v-model="schemeDrawer.selectedSchemeId"
              :items="allSchemes"
              item-title="schemeName"
              item-value="id"
              label="選擇分潤模板"
              variant="outlined"
              density="comfortable"
              clearable
              class="mb-4"
              @update:model-value="loadSchemePreview"
            />

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 font-weight-bold">模板內容</v-card-title>
              <v-progress-linear v-if="schemeDrawer.previewLoading" indeterminate color="primary" />
              <v-table v-else-if="schemeDrawer.preview" density="compact" class="scheme-table">
                <tbody>
                  <tr v-for="row in previewRows" :key="row.label">
                    <th class="text-no-wrap">{{ row.label }}</th>
                    <td>{{ row.value }}</td>
                  </tr>
                </tbody>
              </v-table>
              <v-card-text v-else class="text-medium-emphasis">尚未選擇分潤模板</v-card-text>
            </v-card>

            <div class="text-subtitle-1 font-weight-bold mb-2">修改紀錄</div>
            <p v-if="!schemeDrawer.history.length" class="text-medium-emphasis">尚無修改紀錄</p>
            <div v-else class="d-flex flex-column ga-3">
              <v-card
                v-for="h in schemeDrawer.history"
                :key="h.id"
                variant="outlined"
                class="scheme-history-card"
              >
                <v-card-text class="py-2">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <v-chip size="small" variant="tonal" color="primary">
                      {{ h.createdBy || '系統' }}
                    </v-chip>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatDateTime(h.createdAt) }}
                    </span>
                  </div>
                  <v-table density="compact" class="scheme-table">
                    <tbody>
                      <tr v-for="row in buildSchemeRows(h)" :key="row.label">
                        <th class="text-no-wrap">{{ row.label }}</th>
                        <td>{{ row.value }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </div>
          </template>
        </div>

        <div class="scheme-drawer-footer">
          <v-btn variant="text" @click="schemeDrawer.open = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="schemeDrawer.saving"
            :disabled="!schemeDirty"
            @click="saveScheme"
          >
            儲存變更
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import router from '@/router'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { useDialogStore } from '@/stores/dialog'
import { useAuthStore } from '@/stores/auth'

/* ------ 身分認證 ----------- */
const authStore = useAuthStore()
const isOffice =
  authStore.hasPermission('COURSE_VIEW') && !authStore.hasPermission('PRODUCT_MANAGE_VIEW') //單一行政人員

/* ---------- UI 狀態（由 URL query 還原，轉跳返回後保留搜尋與分頁狀態） ---------- */
const route = useRoute()
const dialog = useDialogStore()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const isValid = ref(route.query.valid !== 'false')
const expanded = ref(
  typeof route.query.expanded === 'string'
    ? route.query.expanded
        .split(',')
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    : [],
)

/* 將搜尋字串、有效/封存狀態、展開列同步到 URL query */
function syncQueryToUrl() {
  const query = {}
  if (search.value) query.q = search.value
  if (!isValid.value) query.valid = 'false'
  if (expanded.value.length) query.expanded = expanded.value.join(',')
  router.replace({ query })
}
watch([search, isValid, expanded], syncQueryToUrl, { deep: true })

const loading = ref(false)
const rows = ref([])
const total = ref(0)

/* ---------- 表頭 ---------- */
const headers = [
  { title: '', key: 'data-table-expand', sortable: false, width: '48' },
  { title: '商品代碼', key: 'product.code' },
  { title: '名稱', key: 'product.name' },
  { title: '分類', key: 'category', value: (item) => item.category?.name ?? '', sortable: true },
  {
    title: '最後編輯時間',
    key: 'product.updatedAt',
    value: (item) => formatDate(item.product.updatedAt),
  },
  ...(!isOffice
    ? [{ title: '操作', key: 'actions', sortable: false, align: 'end', width: '120' }]
    : []),
]

/* ---------- 搜尋與過濾 ---------- */
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function specName(v) {
  return [v.specValueAName, v.specValueBName].filter(Boolean).join('｜')
}

// 規格名稱（兩個規格垂直排列）
function specLines(v) {
  return [v.specValueAName, v.specValueBName].filter(Boolean)
}

function variantMatches(v, term) {
  return (
    normalize(v.sku).includes(term) ||
    normalize(specName(v)).includes(term) ||
    normalize(v.schemeName).includes(term)
  )
}

function productMatches(item, term) {
  return (
    normalize(item.product?.name).includes(term) ||
    normalize(item.product?.code).includes(term) ||
    normalize(item.category?.name).includes(term)
  )
}

const filteredRows = computed(() => {
  const term = normalize(search.value)
  if (!term) return rows.value
  return rows.value.filter(
    (item) =>
      productMatches(item, term) || (item.variants ?? []).some((v) => variantMatches(v, term)),
  )
})

/* 搜尋字串改變時，自動展開符合規格/SKU/分潤模板的商品資料夾；
   清空搜尋則收合。不使用 immediate，避免覆蓋由 URL query 還原的展開狀態。 */
watch(search, (value) => {
  const term = normalize(value)
  if (!term) {
    expanded.value = []
    return
  }
  expanded.value = filteredRows.value
    .filter((item) => (item.variants ?? []).some((v) => variantMatches(v, term)))
    .map((item) => item.product.id)
})

/* 展開資料夾時顯示的規格：搜尋中只列出符合者，否則列出全部 */
function visibleVariants(item) {
  const all = item.variants ?? []
  const term = normalize(search.value)
  if (!term) return all
  const matched = all.filter((v) => variantMatches(v, term))
  return matched.length ? matched : all
}

/* 分類顏色（依分類 ID 固定對應一個顏色） */
const categoryPalette = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'purple',
  'teal',
  'indigo',
  'pink',
  'cyan',
  'deep-orange',
]
function categoryColor(id) {
  if (id == null) return 'grey'
  return categoryPalette[id % categoryPalette.length]
}

/* 分潤模板顏色（不同模板用不同顏色，依模板 ID 固定對應） */
const schemePalette = [
  'deep-purple',
  'indigo',
  'teal',
  'green',
  'orange',
  'pink',
  'blue',
  'red',
  'cyan',
  'brown',
  'light-green',
  'deep-orange',
]
function schemeColor(id) {
  if (id == null) return 'grey'
  return schemePalette[id % schemePalette.length]
}

/* ---------- 分潤模板抽屜（變更規格套用的分潤模板） ---------- */
const allSchemes = ref([]) // 可選的分潤模板清單
const schemeDrawer = reactive({
  open: false,
  loading: false, // 開啟抽屜時載入模板清單/內容
  previewLoading: false, // 切換下拉時載入模板內容
  saving: false,
  variantId: null,
  variantSpecLines: [],
  originalSchemeId: null,
  selectedSchemeId: null,
  preview: null, // 目前選擇模板的完整內容
  history: [], // 目前選擇模板的修改紀錄
})

function formatShareValue(value, type) {
  if (value === null || value === undefined || value === '') return '-'
  const normalizedType = String(type ?? '').toUpperCase()
  if (normalizedType === 'PERCENT') return `${value}%`
  if (normalizedType === 'FIXED') return `${value} 元`
  return String(value)
}

// 由模板物件組出顯示列
function buildSchemeRows(s) {
  if (!s) return []
  return [
    { label: '組織發放', value: s.isRevenueShare ? '是' : '否' },
    { label: '公司比例/金額', value: formatShareValue(s.companyValue) },
    { label: '顧問分潤', value: formatShareValue(s.consultantValue, s.consultantType) },
    { label: '講師分潤', value: formatShareValue(s.lecturerValue, s.lecturerType) },
    { label: '乙方名稱', value: s.partnerName || '-' },
    { label: '乙方分潤', value: formatShareValue(s.partnerShareValue, s.partnerShareType) },
    { label: '行政費', value: formatShareValue(s.adminFeeValue, s.adminFeeType) },
    { label: '使用費', value: formatShareValue(s.usageFeeValue, s.usageFeeType) },
    { label: '管理費', value: formatShareValue(s.managementFeeValue, s.managementFeeType) },
  ]
}

const previewRows = computed(() => buildSchemeRows(schemeDrawer.preview))
const schemeDirty = computed(() => schemeDrawer.selectedSchemeId !== schemeDrawer.originalSchemeId)

function formatDateTime(value) {
  if (!value) return '-'
  return dayjs(value).format('YYYY/MM/DD HH:mm')
}

async function openSchemeDrawer(v) {
  schemeDrawer.open = true
  schemeDrawer.loading = true
  schemeDrawer.variantId = v.variantId
  schemeDrawer.variantSpecLines = specLines(v)
  schemeDrawer.originalSchemeId = v.revenueShareSchemeId ?? null
  schemeDrawer.selectedSchemeId = v.revenueShareSchemeId ?? null
  schemeDrawer.preview = null
  schemeDrawer.history = []

  try {
    if (!allSchemes.value.length) {
      const { data } = await api.get('/RevenueShareScheme')
      allSchemes.value = Array.isArray(data) ? data : []
    }
    if (schemeDrawer.selectedSchemeId) {
      await loadSchemePreview(schemeDrawer.selectedSchemeId)
    }
  } catch (err) {
    dialog.showAxiosError(err, '分潤模板讀取失敗')
    schemeDrawer.open = false
  } finally {
    schemeDrawer.loading = false
  }
}

async function loadSchemePreview(id) {
  schemeDrawer.preview = null
  schemeDrawer.history = []
  if (!id) return
  schemeDrawer.previewLoading = true
  try {
    const [schemeRes, historyRes] = await Promise.all([
      api.get(`/RevenueShareScheme/${id}`),
      api.get(`/RevenueShareSchemeHistory/${id}`),
    ])
    schemeDrawer.preview = schemeRes.data ?? null
    schemeDrawer.history = Array.isArray(historyRes.data) ? historyRes.data : []
  } catch (err) {
    dialog.showAxiosError(err, '分潤模板內容讀取失敗')
    schemeDrawer.preview = null
    schemeDrawer.history = []
  } finally {
    schemeDrawer.previewLoading = false
  }
}

async function saveScheme() {
  if (!schemeDrawer.variantId) return
  schemeDrawer.saving = true
  try {
    await api.patch(`/Product/Variant/${schemeDrawer.variantId}/RevenueShareScheme`, {
      revenueShareSchemeId: schemeDrawer.selectedSchemeId ?? null,
    })
    dialog.showSuccess('變更成功', '已更新此規格套用的分潤模板')
    schemeDrawer.open = false
    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '分潤模板變更失敗')
  } finally {
    schemeDrawer.saving = false
  }
}

/* ---------- 資料讀取 ---------- */
async function fetchData() {
  loading.value = true
  try {
    if (isOffice) {
      const { data } = await api.get(`/Product/GetCourse/${isValid.value}`)

      rows.value = data
      total.value = rows.value.length
      return
    }

    const { data } = await api.get(`/Product/Get/${isValid.value}`)
    rows.value = data
    total.value = rows.value.length
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    loading.value = false
  }
}

/* 日期樣式 */
function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

/* 切換 Tab 時重置頁碼，避免維度改變但仍停留在高頁碼 */
function onTabChange() {
  fetchData()
}

/* ---------- 動作 ---------- */
function onRowClick(item) {
  if (isOffice) {
    router.push({ name: 'CourseDetail', params: { id: item.product.id } })
  } else {
    router.push({ name: 'ProductEdit', params: { id: item.product.id } })
  }
}

function goToVariant(productId, variantId) {
  if (isOffice) return
  router.push({
    name: 'ProductEdit',
    params: { id: productId },
    query: { variantId: String(variantId) },
  })
}

async function archive(id) {
  const ok = await dialog.askConfirm({
    title: '封存確認',
    message: '確認封存嗎?',
    isDelete: false,
  })

  if (!ok) return

  try {
    dialog.showLoading()
    await api.patch(`/Product/ToggleIsActive/${id}`)
    await fetchData()
  } catch (e) {
    dialog.showError('封存失敗', e?.message || '請稍後再試')
  } finally {
    dialog.hideLoading()
  }
}

async function confirmDelete(id) {
  // 打開全域/單一刪除確認 dialog
  const ok = await dialog.askConfirm({
    title: '刪除確認',
    message: '確定要刪除這個商品嗎？此動作無法復原。',
    isDelete: true,
  })

  if (!ok) return

  try {
    dialog.showLoading()
    await api.delete(`/Product/Delete/${id}`)
    await fetchData()
  } catch (e) {
    dialog.showError('刪除失敗', e?.message || '請稍後再試')
  } finally {
    dialog.hideLoading()
  }
}

onMounted(async () => {
  await fetchData()
})
</script>

<style scoped lang="scss">
.main-title h2 {
  margin: 0 0 4px;
}

.v-data-table :deep(table thead) {
  background-color: #f5f5f5;
  color: #333;
}

.variant-folder-tr td {
  background-color: #fafafa;
}

.variant-folder {
  padding: 4px 0;
}

.variant-folder-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 16px 10px 40px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.variant-folder-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.variant-folder-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.variant-spec-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.variant-spec-name {
  font-size: 0.875rem;
  color: #333;
  line-height: 1.5;
}

.scheme-table :deep(th) {
  width: 110px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 600;
}

.scheme-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.scheme-drawer-header {
  flex: 0 0 auto;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.scheme-variant-spec {
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}

.scheme-drawer-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px;
}

.scheme-drawer-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
