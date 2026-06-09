<template>
  <div class="page-wrapper">
    <v-container fluid class="pa-6 pb-0">
      <div class="main-title flex-row align-center justify-space-between">
        <h2>商品費用科目參數</h2>
        <v-btn
          :width="100"
          class="mr-4"
          prepend-icon="add"
          variant="flat"
          color="primary"
          @click="addDialog = true"
          >新增</v-btn
        >
      </div>
    </v-container>
    <v-container fluid class="main pa-6">
      <div class="cards-grid">
        <v-card v-for="item in templates" :key="item.id">
          <v-card-title class="d-flex justify-space-between">
            <div>{{ item.subject }}</div>
            <v-btn color="primary" variant="text" prepend-icon="edit" @click="openEdit(item)">
              編輯
            </v-btn>
          </v-card-title>
          <v-card-text>
            <b> 分潤角色模板({{ item.revenueShareSubjectRecipients.length }}) </b>
          </v-card-text>
          <v-divider> </v-divider>
          <v-card-actions class="d-flex align-center justify-space-between">
            <v-switch
              v-model="item.isActive"
              color="primary"
              hide-details
              inset
              :disabled="item._toggling"
              @update:modelValue="(val) => toggleIsActive(item, val)"
            />
            <v-btn color="gray_100" @click="deleteFeeTemplate(item.id)"
              ><v-icon>delete</v-icon></v-btn
            >
          </v-card-actions>
        </v-card>
      </div>
    </v-container>
  </div>
  <v-navigation-drawer v-model="addDialog" location="right" temporary :width="850" class="scrollable-body-drawer">
    <div class="d-flex flex-column h-100">
      <!-- Header -->
      <div class="pa-4 d-flex align-center justify-space-between">
        <div>
          <div class="text-h5 mb-1">
            {{ mode === 'create' ? '商品費用科目新增' : '商品費用科目編輯' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            請加入受配對象與分配值；百分比總和建議 ≤ 100%
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="addDialog = false" />
      </div>

      <!-- 科目名稱 -->
      <div class="px-4 pb-2">
        <v-text-field
          v-model="form.name"
          color="primary"
          label="科目名稱（例如：管理費 / 使用費 / 顧問…）"
          variant="outlined"
          density="compact"
          :rules="[rules.required]"
        />
      </div>

      <v-divider />

      <!-- Scrollable content -->
      <div
        class="pa-4"
        :style="{ backgroundColor: 'rgb(var(--v-theme-secondary))', overflow: 'auto', flex: 1 }"
      >
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-h6">受配對象</div>
          <div class="d-flex align-center ga-2">
            <div class="text-caption text-medium-emphasis">
              受配對象數：<b>{{ form.recipients.length }}</b>
            </div>
            <v-btn color="primary" size="small" variant="tonal" prepend-icon="add" @click="addRow">
              新增對象
            </v-btn>
          </div>
        </div>
        <!-- 每一列受配對象 -->
        <v-card
          variant="flat"
          v-for="(row, idx) in form.recipients"
          :key="row.id"
          class="pa-3 mb-2"
        >
          <div class="d-flex align-start ga-2">
            <!-- 對象選擇器：用 v-select 當啟動器；面板內切換內部/外部 + 搜尋 + 清單 -->
            <v-select
              v-model="row.selected"
              :items="row.tab === 'internal' ? row.internalList : row.externalList"
              item-title="label"
              item-value="value"
              label="選擇對象（內部或外部）"
              density="compact"
              hide-details="auto"
              :loading="row.loading"
              :virtual-scroll="false"
              :list-props="{ style: 'padding:0;margin:0' }"
              :menu-props="{
                closeOnContentClick: false,
                contentClass: 'custom-select-menu',
                maxHeight: 360,
              }"
              return-object
              width="150"
              @update:menu="(open) => onMenuUpdate(row, open)"
              @update:modelValue="(val) => onPick(row, val)"
            >
              <template #prepend-item>
                <div class="sticky-header pa-3" @mousedown.stop @touchstart.stop>
                  <div class="mb-2 d-flex">
                    <v-btn
                      class="mr-2"
                      size="small"
                      rounded
                      :color="row.tab === 'internal' ? 'primary' : undefined"
                      variant="tonal"
                      @click="switchTab(row, 'internal')"
                    >
                      內部會員
                    </v-btn>
                    <v-btn
                      size="small"
                      rounded
                      :color="row.tab === 'external' ? 'primary' : undefined"
                      variant="tonal"
                      @click="switchTab(row, 'external')"
                    >
                      外部會員
                    </v-btn>
                  </div>
                  <v-text-field
                    v-model="row.search"
                    :ref="(el) => setSearchRef(row, el)"
                    hide-details
                    density="compact"
                    prepend-inner-icon="search"
                    clearable
                    @keydown.stop
                    @click:clear="(e) => onClear(row, e)"
                    @keyup.enter.prevent="() => onEnter(row)"
                  />
                  <v-divider class="mt-2" />
                </div>
              </template>

              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #title>{{ item?.title ?? item?.label }}</template>
                  <template #subtitle>
                    <span>{{ item?.raw?.email }}</span>
                    <span v-if="item?.raw?.scope" class="ml-2 text-caption text-medium-emphasis">
                      （{{ item.raw.scope === 'internal' ? '內部' : '外部' }}）
                    </span>
                  </template>
                </v-list-item>
              </template>
              <template #no-data>
                <div class="pa-4 text-medium-emphasis">
                  <div v-if="row.loading">載入中…</div>
                  <div v-else-if="row.search">找不到「{{ row.search }}」的結果</div>
                  <div v-else>目前沒有資料，請輸入關鍵字或切換「內部 / 外部」。</div>
                </div>
              </template>
            </v-select>

            <!-- 分配類型 -->
            <v-select
              v-model="row.allocType"
              :items="allocTypeOptions"
              label="分配型態"
              density="compact"
              hide-details="auto"
              style="width: 80px"
            />

            <!-- 分配數值 -->
            <v-text-field
              v-model.number="row.allocValue"
              :label="row.allocType === AllocType.Percent ? '百分比 %' : '固定金額'"
              type="number"
              min="0"
              density="compact"
              hide-details="auto"
              style="width: 50px"
            />

            <v-btn
              size="small"
              icon="delete"
              class="ml-2"
              @click="removeRow(idx)"
              variant="plain"
            />
          </div>

          <!-- 列內錯誤提示 -->
          <div v-if="rowError(row)" class="text-error text-caption mt-2">{{ rowError(row) }}</div>
        </v-card>
      </div>

      <v-divider />

      <!-- Footer actions -->
      <div class="pa-4 d-flex justify-end ga-2">
        <v-btn color="secondary" variant="flat" @click="addDialog = false">取消</v-btn>
        <v-btn color="primary" :loading="saving" :disabled="!canSubmit || saving" @click="submit">
          {{ mode === 'create' ? '新增' : '儲存' }}
        </v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'

const dialog = useDialogStore()
const mode = ref('create') // 'create' | 'edit'
const editingId = ref(null)
/* === 取得模板資料 === */
const addDialog = ref(false)
const templates = ref([])
function toTemplate(x) {
  return {
    id: x.id ?? x.Id,
    subject: x.subject ?? x.Subject,
    isActive: x.isActive ?? x.IsActive,
    revenueShareSubjectRecipients:
      x.revenueShareSubjectRecipients ?? x.RevenueShareSubjectRecipients ?? [],
  }
}
async function fetchSubject() {
  try {
    const { data } = await api.get(`RevenueShareSubject/Get`)
    console.log(data)
    templates.value = data
    templates.value = Array.isArray(data) ? data.map(toTemplate) : []
  } catch (error) {
    console.log(error)
  }
}

//編輯模板
function openEdit(item) {
  mode.value = 'edit'
  editingId.value = item.id
  // 取詳細（若列表已含完整 recipients，也可直接用 item）
  loadTemplateDetail(item.id)
  addDialog.value = true
}
async function loadTemplateDetail(id) {
  const { data } = await api.get(`RevenueShareSubject/Get/${id}`)
  // 正規化欄位（大小寫）
  const subject = data.subject ?? data.Subject
  const recipients = data.revenueShareSubjectRecipients ?? data.RevenueShareSubjectRecipients ?? []

  // 填科目名稱
  form.value.name = subject

  // 把 recipients 轉成每列 row（含 selector 狀態）
  form.value.recipients = recipients.map((r) => {
    // 後端是 PERCENT/FIXED，前端顯示我們用 "Percent"/"Fixed"（若你已改為直接用字串也可）
    const allocType =
      (r.allocType ?? r.AllocType)?.toUpperCase() === 'PERCENT'
        ? AllocType.Percent
        : AllocType.Fixed

    // 判斷 internal/external 與 memberId
    const isInternal = (r.kind ?? r.Kind)?.toUpperCase() === 'ACCOUNT'
    const memberId = isInternal
      ? String(r.accountGuid ?? r.AccountGuid ?? '')
      : String(r.externalMemberId ?? r.ExternalMemberId ?? '')

    const name = r.displayName ?? r.DisplayName ?? ''
    const email = r.email ?? r.Email ?? '' // 若後端 recipients 沒 Email，可在選人時再取

    // 建 row
    const row = newRow()
    row.kind = isInternal ? 'internal' : 'external'
    row.tab = row.kind
    row.memberId = memberId
    row.memberName = name
    row.memberEmail = email
    row.allocType = allocType
    row.allocValue = Number(r.allocValue ?? r.AllocValue ?? 0)

    // 讓 selector 顯示當前選擇（selected 要有 label/value）
    row.selected = {
      label: name || email || memberId,
      value: memberId,
      email,
      raw: { scope: row.kind },
    }
    return row
  })

  // 重新掛 watcher
  form.value.recipients.forEach(attachRowWatchers)
}

//刪除模板資料
async function deleteFeeTemplate(id) {
  const ok = await dialog.askConfirm({
    title: '刪除確認',
    message: '確定要刪除這個科目嗎？此動作無法復原。',
    isDelete: true,
  })
  if (!ok) return
  try {
    const { data } = await api.delete(`RevenueShareSubject/Delete/${id}`)
    await fetchSubject()
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  fetchSubject()
})

/* 分配型態(百分比、固定) */
const AllocType = {
  Percent: 'Percent',
  Fixed: 'Fixed',
}
const allocTypeOptions = [
  { title: '百分比 %', value: AllocType.Percent },
  { title: '固定金額', value: AllocType.Fixed },
]

/** ===== 表單狀態 ===== */
let uid = 0
const newRow = () => ({
  id: ++uid,

  // selector 內部狀態（各列獨立）
  tab: 'internal', // 'internal' | 'external'
  search: '',
  selected: null, // return-object 選取值 { label,value,email,raw:{...,scope} }
  loading: false,
  internalList: [],
  externalList: [],
  _debounce: null, // 列級 debounce 計時器

  // 要送後端的關鍵欄位
  kind: 'internal', // UI 用，轉成 ACCOUNT/EXTERNAL
  memberId: null, // internal=Guid / external=number
  memberName: '',
  memberEmail: '',
  displayText: '',

  // 分配
  allocType: AllocType.Percent, // 'PERCENT' | 'FIXED'
  allocValue: null,
})
const form = ref({
  name: '',
  recipients: [newRow()], // 初始一列
})

/** ===== 驗證 ===== */
const rules = {
  required: (v) => (v !== null && v !== undefined && String(v).trim() !== '') || '此欄位必填',
}

function rowError(r) {
  if (!r.memberId) return '請選擇對象'
  if (r.allocType === AllocType.Percent) {
    if (r.allocValue == null || r.allocValue < 0 || r.allocValue > 100) return '百分比需介於 0–100'
  } else {
    if (r.allocValue == null || r.allocValue < 0) return '固定金額需 ≥ 0'
  }
  return null
}

const percentTotal = computed(() =>
  form.value.recipients
    .filter((r) => r.allocType === AllocType.Percent)
    .reduce((s, r) => s + Number(r.allocValue ?? 0), 0),
)

const canSubmit = computed(() => {
  if (!form.value.name.trim()) return false
  if (!form.value.recipients.length) return false
  if (percentTotal.value > 100) return false
  for (const r of form.value.recipients) if (rowError(r)) return false
  return true
})

/** ===== 其他（樣式小工具） ===== */
const styles = `
.cursor-pointer { cursor: pointer; }
`
if (typeof window !== 'undefined') {
  const s = document.createElement('style')
  s.innerText = styles
  document.head.appendChild(s)
}

// 讓每列搜尋能 focus
const searchRefs = new Map()
function setSearchRef(row, el) {
  searchRefs.set(row.id, el)
}
function focusSearch(row) {
  searchRefs.get(row.id)?.focus?.()
}

// ---- 工具：把後端資料轉成 v-select 需要的格式 ----
function normalize(list, scope) {
  return (Array.isArray(list) ? list : []).map((e) => {
    // 兼容大小寫（Pascal/Camel）
    const accountGuid = e.AccountGuid ?? e.accountGuid ?? null
    const externalMemberId = e.ExternalMemberId ?? e.externalMemberId ?? null
    const name = e.DisplayName ?? e.displayName ?? ''
    const email = e.Email ?? e.email ?? ''

    // internal 用 Guid；external 用 Id（字串化避免型別抖動）
    const value =
      scope === 'internal'
        ? accountGuid != null
          ? String(accountGuid)
          : ''
        : externalMemberId != null
          ? String(externalMemberId)
          : ''

    const label = name || email || value

    return {
      // Vuetify：item-title="label" 會映射成 item.title 可用於 slot
      label,
      value,
      email,
      raw: { accountGuid, externalMemberId, name, email, scope },
    }
  })
}

// ---- 取資料 ----
async function fetchRecipients(row) {
  row.loading = true
  try {
    const { data } = await api.get('/RevenueShareSubject/GetRecipients', {
      params: { search: row.search, scope: row.tab },
    })

    const mapped = normalize(data, row.tab)
    if (row.tab === 'internal') row.internalList = mapped
    else row.externalList = mapped
    const list = row.tab === 'internal' ? row.internalList : row.externalList
    if (!list.some((i) => i.value === row.selected?.value)) row.selected = null
  } finally {
    row.loading = false
  }
}

// ---- 開啟選單：聚焦 + 若清單空就抓一次 ----
const onMenuUpdate = async (row, open) => {
  if (!open) return
  await nextTick()
  focusSearch(row)
  const list = row.tab === 'internal' ? row.internalList : row.externalList
  if (list.length === 0) fetchRecipients(row)
}

// ---- 清除搜尋 ----
function onClear(row, e) {
  e?.stopPropagation?.()
  row.search = ''
  requestAnimationFrame(() => focusSearch(row))
  fetchRecipients(row)
}

// ---- 切換 tab ----
function switchTab(row, next) {
  if (row.tab === next) return
  row.search = ''
  row.tab = next
  fetchRecipients(row)
}

// ---- Enter 查詢 ----
function onEnter(row) {
  fetchRecipients(row)
}

// ---- 搜尋去抖 ----
function onRowSearchInput(row) {
  if (row._debounce) clearTimeout(row._debounce)
  row._debounce = setTimeout(() => fetchRecipients(row), 500)
}

// 新增列時掛 watcher
function attachRowWatchers(row) {
  watch(
    () => row.search,
    () => onRowSearchInput(row),
    { flush: 'post' },
  )
}

attachRowWatchers(form.value.recipients[0]) // 初始那列
function addRow() {
  const r = newRow()
  form.value.recipients.push(r)
  attachRowWatchers(r)
}
function removeRow(idx) {
  form.value.recipients.splice(idx, 1)
}

// 選到人 → 寫回 row 要送後端的欄位
function onPick(row, val) {
  if (!val) {
    row.memberId = null
    row.memberName = ''
    row.memberEmail = ''
    row.displayText = ''
    return
  }

  // 我們在 normalize 已經把內/外做了 value 決策
  // internal -> value = AccountGuid；external -> value = ExternalMemberId
  row.memberId = val.value

  const name = val.raw?.name ?? ''
  const email = val.raw?.email ?? ''
  row.memberName = name
  row.memberEmail = email
  row.displayText = name ? (email ? `${name} <${email}>` : name) : email || val.value

  // 同步來源（保險起見，用 raw.scope，沒有就用當前 tab）
  row.kind =
    val.raw?.scope === 'internal' || val.raw?.scope === 'external' ? val.raw.scope : row.tab
}

function buildPayload() {
  return {
    subject: {
      subject: form.value.name.trim(),
      sortOrder: 0,
      isActive: true,
    },
    recipients: form.value.recipients.map((r) => ({
      kind: r.kind === 'internal' ? 'ACCOUNT' : 'EXTERNAL',
      accountGuid: r.kind === 'internal' ? r.memberId : null,
      externalMemberId:
        r.kind === 'external' && r.memberId != null && r.memberId !== ''
          ? Number(r.memberId) // 後端是 int
          : null,
      displayName: r.memberName || r.memberEmail || null,
      allocType: r.allocType, // "Percent" / "Fixed"（你上一則的改動）
      allocValue: Number(r.allocValue ?? 0),
    })),
  }
}

/* 送出 */
const saving = ref(false)

async function submit() {
  if (!canSubmit.value) return
  const payload = buildPayload()

  saving.value = true
  try {
    console.log(payload)
    if (mode.value === 'create') {
      await api.post('/RevenueShareSubject/Create', payload)
    } else {
      await api.put(`/RevenueShareSubject/Update/${editingId.value}`, payload)
    }

    // ✅ 成功：關抽屜、提示、重置
    addDialog.value = false

    // 重置
    mode.value = 'create'
    editingId.value = null
    form.value = { name: '', recipients: [newRow()] }
    searchRefs.clear()
    attachRowWatchers(form.value.recipients[0])

    // 重抓列表
    await fetchSubject()
  } catch (err) {
    const msg = err?.response?.data || err?.message || '建立失敗'
    console.error(msg)
    alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
  } finally {
    saving.value = false
  }
}

/* 切換啟用停用 */
async function toggleIsActive(item, nextVal) {
  if (item._toggling) return
  const prevVal = !nextVal

  // 只有「要停用」時才確認（true -> false）
  if (prevVal === true && nextVal === false) {
    const ok = await dialog.askConfirm?.({
      title: '停用確認',
      message: '停用後此科目將於前台隱藏且不參與計算，確定要停用？',
    })
    if (!ok) {
      item.isActive = prevVal
      return
    }
  }

  // 樂觀更新 + 失敗回滾
  item._toggling = true
  try {
    await api.patch(`/RevenueShareSubject/ToggleIsActive/${item.id}`)
  } catch (e) {
    console.error(e)
    item.isActive = prevVal // 回滾
    dialog.showError?.('更新失敗', e?.response?.data ?? '請稍後再試')
  } finally {
    item._toggling = false
  }
}
</script>
<style scoped lang="scss">
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /*頁面最少全螢幕高度*/
}

.main {
  flex: 1 1 auto;
  background: rgb(var(--v-theme-secondary));
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 欄 */
  gap: 24px;
}

/* 讓下拉層本身成為滾動容器與 stacking context */
.custom-select-menu {
  position: relative;
  max-height: 360px; /* 與 menu-props 對齊 */
  overflow-y: auto;
}

/* 置頂區：固定在最上層，避免被清單蓋到 */
.custom-select-menu .sticky-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
}

.scrollable-body-drawer :deep(.v-navigation-drawer__content) {
  overflow-y: hidden !important;
}
</style>
