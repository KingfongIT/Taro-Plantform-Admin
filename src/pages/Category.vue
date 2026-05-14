<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>商品分類</h2>
    </div>
    <v-row>
      <v-col>
        <v-card border>
          <v-card-title class="d-flex align-center pe-2">
            全部
            <v-spacer />
            <v-btn
              prepend-icon="sort"
              class="mr-3"
              color="secondary"
              variant="flat"
              @click="openSortDialog"
            >
              排序
            </v-btn>
            <v-btn
              prepend-icon="add"
              class="mr-3"
              color="primary"
              variant="flat"
              @click="addDialog = true"
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

          <!-- 簡化：用 v-data-table (前端) -->
          <v-data-table
            :headers="headers"
            :items="filteredItems"
            :loading="loading"
            item-key="id"
            class="elevation-0"
            hover
          >
            <template #item.isActive="{ item }">
              <v-switch
                color="primary"
                hide-details
                inset
                :model-value="item.isActive"
                @update:model-value="(val) => onToggleActive(item, val)"
              />
            </template>

            <template #item.actionSorted="{ item }">
              <v-btn variant="text" color="primary" @click="sortProduct(item.id)">商品排序</v-btn>
              <v-btn
                v-if="item.code == 'AD'"
                variant="text"
                color="primary"
                @click="openLevelDialog(item.id)"
                >系統等級排序</v-btn
              >
            </template>
            <template #item.actions="{ item }">
              <v-btn
                icon
                class="mr-2"
                color="secondary"
                size="small"
                variant="flat"
                @click="openEditCategory(item.id)"
                ><v-icon color="gray_100" round>edit</v-icon></v-btn
              >
              <v-btn
                icon
                class="mr-2"
                size="small"
                variant="flat"
                color="secondary"
                @click="deleteCategory(item.id)"
                ><v-icon color="gray_100">delete</v-icon></v-btn
              >
            </template>

            <template #no-data>
              <div class="text-center pa-6">
                <img src="/images/NoSearch.svg" />
                <h6 class="mt-2">搜尋無結果</h6>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- 新增分類 Dialog -->
  <v-dialog v-model="addDialog" max-width="420">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 ps-2">新增商品類別</div>
        <v-btn icon="close" variant="text" @click="closeAddDialog" />
      </v-card-title>

      <v-card-text>
        <v-text-field label="分類代號" clearable :rules="[required]" v-model="categoryCode" />
        <v-text-field label="分類名稱" clearable :rules="[required]" v-model="categoryName" />
        <div class="d-flex justify-end">
          <v-checkbox color="primary" v-model="isActive" label="是否啟用" hide-details />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeAddDialog" color="secondary" variant="flat">取消</v-btn>
        <v-btn :loading="savingAdd" @click="addCategory" color="primary" variant="flat">新增</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 排序asd分類 Dialog -->
  <v-dialog v-model="sortDialog" max-width="560">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-h6">拖曳調整「商品類別」排序</span>
        <v-spacer />
        <v-btn icon="close" variant="text" @click="sortDialog = false" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <p class="text-body-2 mb-2">拖曳左側把手可更改順序。按下「儲存排序」後才會寫入後端。</p>

        <v-list lines="one">
          <draggable
            v-model="allCategoriesForSort"
            item-key="id"
            handle=".drag-handle"
            :animation="180"
          >
            <template #item="{ element, index }">
              <v-list-item :key="element.id" border>
                <template #prepend>
                  <v-btn icon="drag_indicator" variant="text" class="drag-handle" />
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ element.slug }} — {{ element.name }}
                </v-list-item-title>

                <template #append>
                  <v-chip
                    size="small"
                    :color="element.isActive ? 'success' : undefined"
                    variant="tonal"
                  >
                    #{{ index + 1 }} · {{ element.isActive ? '啟用' : '停用' }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>
          </draggable>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="flat" color="secondary" @click="cancelSortOrder">取消</v-btn>
        <v-btn variant="flat" color="primary" :loading="savingSort" @click="saveSortOrder"
          >儲存排序</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 排序商品 Dialog -->
  <v-dialog v-model="sortProductDialog" max-width="560">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-h6">拖曳調整「商品」排序</span>
        <v-spacer />
        <v-btn icon="close" variant="text" @click="sortProductDialog = false" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <p class="text-body-2 mb-2">拖曳左側把手可更改順序。按下「儲存排序」後才會寫入後端。</p>

        <v-list lines="one">
          <draggable
            v-model="allProductsForSort"
            item-key="id"
            handle=".drag-handle"
            :animation="180"
          >
            <template #item="{ element, index }">
              <v-list-item :key="element.id" border>
                <template #prepend>
                  <v-btn icon="drag_indicator" variant="text" class="drag-handle" />
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ element.product.name }}
                </v-list-item-title>
              </v-list-item>
            </template>
          </draggable>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="flat" color="secondary" @click="cancelSortProduct">取消</v-btn>
        <v-btn variant="flat" color="primary" @click="saveSortProduct">儲存排序</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 編輯 Dialog -->
  <v-dialog v-model="editDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 ps-2">編輯商品類別</div>
        <v-btn icon="close" variant="text" @click="editDialog = false" />
      </v-card-title>

      <v-card-text>
        <v-text-field label="分類代號" clearable :rules="[required]" v-model="editCategoryCode" />
        <v-text-field label="分類名稱" clearable :rules="[required]" v-model="editCategoryName" />
        <div class="d-flex justify-end">
          <v-checkbox color="primary" v-model="editIsActive" label="是否啟用" hide-details />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="editDialog = false" color="secondary" variant="flat">取消</v-btn>
        <v-btn :loading="savingEdit" @click="editCategory" color="primary" variant="flat"
          >儲存</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 系統等級排序 Dialog -->
  <LevelSetting v-model:dialog="levelDialog" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import LevelSetting from '@/components/LevelSetting.vue'

const dialog = useDialogStore()

// UI 狀態
const loading = ref(false)
const savingAdd = ref(false)
const savingEdit = ref(false)
const savingSort = ref(false)

// 表格與搜尋
const items = ref([])
const search = ref('')

const headers = [
  { title: '編號', key: 'code', align: 'start', width: 150 },
  { title: '分類名稱', key: 'name', align: 'start' },
  { title: '商品數量', key: 'productCategories.length', align: 'start' },
  { title: '商品排序', key: 'actionSorted', align: 'start' },
  { title: '是否啟用', key: 'isActive', width: 200 },
  { title: '操作', key: 'actions', width: 200, sortable: false },
]

const filteredItems = computed(() => {
  const q = (search.value || '').toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter(
    (x) => (x.slug || '').toLowerCase().includes(q) || (x.name || '').toLowerCase().includes(q),
  )
})

// 新增 Dialog 狀態
const addDialog = ref(false)
const categoryCode = ref('')
const categoryName = ref('')
const isActive = ref(true)

// 編輯 Dialog 狀態
const editDialog = ref(false)
const editCategoryId = ref(null)
const editCategoryCode = ref('')
const editCategoryName = ref('')
const editIsActive = ref(true)

// 排序 Dialog 狀態
const sortDialog = ref(false)
const allCategoriesForSort = ref([]) // 用 v-model 綁定 draggable

// 驗證
function required(v) {
  return !!v || '為必填欄位'
}

// 取資料
async function fetchData() {
  loading.value = true
  try {
    const { data } = await api.get('/Category/Get')
    // 後端若已排序好就直接用；否則可在這裡 sort by sortOrder
    items.value = data ?? []
  } catch (e) {
    dialog.showError('讀取失敗', e?.message || '請稍後再試')
  } finally {
    loading.value = false
  }
}

// 新增
async function addCategory() {
  if (!categoryCode.value || !categoryName.value) return
  savingAdd.value = true
  try {
    await api.post('/Category/Create', {
      name: categoryName.value,
      code: categoryCode.value,
      isActive: isActive.value,
    })
    await fetchData()
    closeAddDialog()
  } catch (e) {
    dialog.showError('新增失敗', e?.message || '請稍後再試')
  } finally {
    savingAdd.value = false
  }
}
function closeAddDialog() {
  categoryName.value = ''
  categoryCode.value = ''
  isActive.value = true
  addDialog.value = false
}

// 開啟編輯
async function openEditCategory(id) {
  editDialog.value = true
  try {
    const { data } = await api.get(`/Category/Get/${id}`)
    editCategoryId.value = data.id
    editCategoryCode.value = data.code
    editCategoryName.value = data.name
    editIsActive.value = data.isActive
  } catch (e) {
    dialog.showError('讀取失敗', e?.message || '請稍後再試')
  }
}

// 儲存編輯
async function editCategory() {
  if (!editCategoryId.value) return
  savingEdit.value = true
  try {
    await api.patch(`/Category/Update`, {
      id: editCategoryId.value,
      name: editCategoryName.value,
      code: editCategoryCode.value,
      isActive: editIsActive.value,
    })
    // 同步更新本地 or 直接重抓
    await fetchData()
    editDialog.value = false
  } catch (e) {
    dialog.showError('儲存失敗', e?.message || '請稍後再試')
  } finally {
    savingEdit.value = false
  }
}

// 刪除
async function deleteCategory(id) {
  const ok = await dialog.askConfirm({
    title: '刪除確認',
    message: '確定要刪除這個分類嗎？此動作無法復原。',
    isDelete: true,
  })
  if (!ok) return

  try {
    dialog.showLoading()
    await api.delete(`/Category/Delete/${id}`)
    await fetchData()
  } catch (e) {
    dialog.showError('刪除失敗', e?.message || '請稍後再試')
  } finally {
    dialog.hideLoading()
  }
}

// 切換啟用
async function onToggleActive(item, val) {
  // val 是使用者切換後的值（true/false）
  const prev = !val

  try {
    // 只有在「要停用」時才跳確認
    if (val === false) {
      const ok = await dialog.askConfirm({
        title: '停用後將於前台隱藏',
        message: '確定要停用這個分類嗎？',
      })
      if (!ok) {
        // 使用者取消 → 還原 UI
        return
      }
    }

    // 送後端更新
    await api.patch(`/Category/ToggleIsActive/${item.id}`)
    item.isActive = val
  } catch (e) {
    dialog.showError('更新失敗', e?.message || '請稍後再試')
    // 發生錯誤 → 還原 UI
    item.isActive = prev
  }
}

/*============== 商品排序 =============*/
const sortProductDialog = ref(false)
const allProductsForSort = ref([])

async function sortProduct(id) {
  sortProductDialog.value = true
  await fetchProductCategory(id)
}

async function fetchProductCategory(id) {
  dialog.showLoading()
  try {
    const { data } = await api.get(`/Category/GetProductCategory/${id}`)
    allProductsForSort.value = data
  } catch (error) {
    dialog.showError('資料獲取失敗', e?.message || '請稍後再試')
  } finally {
    dialog.hideLoading()
  }
}

async function saveSortProduct() {
  dialog.showLoading()
  try {
    const payload = allProductsForSort.value.map((x, i) => ({ id: x.id, sortIndex: i + 1 }))
    await api.post(`/Category/ReorderProduct`, payload)
  } catch (error) {
    dialog.showError('排序儲存失敗', e?.message || '請稍後再試')
  } finally {
    dialog.hideLoading()
    sortProductDialog.value = false
  }
}

function cancelSortProduct() {
  sortProductDialog.value = false
}

// 排序對話框
async function openSortDialog() {
  try {
    const { data } = await api.get('/Category/Get')
    allCategoriesForSort.value = data ?? []
    sortDialog.value = true
  } catch (e) {
    dialog.showError('讀取失敗', e?.message || '請稍後再試')
  }
}
function cancelSortOrder() {
  sortDialog.value = false
}
async function saveSortOrder() {
  savingSort.value = true
  try {
    // 後端若吃 ids 陣列
    // const ids = allCategoriesForSort.value.map(x => x.id)
    // await api.put('/test/reorder', { ids })

    // 後端若吃 [{id, sortIndex}]
    const payload = allCategoriesForSort.value.map((x, i) => ({ id: x.id, sortIndex: i + 1 }))
    await api.post('/Category/Reorder', payload)

    await fetchData()
    sortDialog.value = false
  } catch (e) {
    dialog.showError('排序儲存失敗', e?.message || '請稍後再試')
  } finally {
    savingSort.value = false
  }
}

/* 系統等級排序 */
const levelDialog = ref(false)
function openLevelDialog(id) {
  levelDialog.value = true
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.v-data-table :deep(table thead) {
  background-color: #f5f5f5;
  color: #333;
}
</style>
