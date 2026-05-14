<template>
  <!-- 左側分類面板 -->
  <v-sheet class="category-panel d-flex flex-column">
    <!-- 標題 + 搜尋 + 新增 -->
    <header class="category-panel__header">
      <div class="d-flex align-center mb-3">
        <h3 class="mr-3 mb-0">分類</h3>
        <v-text-field
          v-model="search"
          prepend-inner-icon="search"
          density="compact"
          placeholder="輸入名稱搜尋"
          hide-details
        />
      </div>

      <v-btn
        class="w-100"
        prepend-icon="add"
        color="primary"
        variant="outlined"
        @click="openCreate"
      >
        新增
      </v-btn>
    </header>

    <v-divider />

    <!-- 清單區：可自動撐高 + 滾動 -->
    <div class="category-panel__body">
      <v-table density="compact" hover class="category-table">
        <tbody>
          <tr
            v-for="category in filteredCategories"
            :key="category.id"
            class="category-row"
            :class="{ 'is-active': category.id === selectedCategory?.id }"
            @click="handleSelect(category)"
          >
            <td class="category-table__name">
              {{ category.name }}
            </td>

            <td class="category-table__actions">
              <v-menu location="bottom end" offset="8">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="small"
                    variant="text"
                    icon
                    @click.stop
                    aria-label="更多操作"
                  >
                    <v-icon>more_horiz</v-icon>
                  </v-btn>
                </template>

                <v-list density="compact">
                  <v-list-item @click.stop="openEdit(category.id)">
                    <template #prepend>
                      <v-icon>edit</v-icon>
                    </template>
                    <v-list-item-title>編輯</v-list-item-title>
                  </v-list-item>

                  <v-list-item @click.stop="confirmDelete(category.id)">
                    <template #prepend>
                      <v-icon color="error">delete</v-icon>
                    </template>
                    <v-list-item-title class="text-error"> 刪除 </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>

          <!-- 沒資料時顯示文字（可選） -->
          <tr v-if="!filteredCategories.length">
            <td colspan="2" class="text-center py-4 text-medium-emphasis">尚未建立任何分類</td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-sheet>

  <!-- 新增 / 編輯 dialog -->
  <v-dialog v-model="upsertDialog" max-width="350">
    <v-card>
      <v-card-title>
        {{ isEdit ? '編輯顧問師分類' : '新增顧問師分類' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="formValid">
          <v-text-field
            v-model="categoryName"
            :rules="[rules.required]"
            variant="outlined"
            placeholder="分類名稱"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="handleCloseDialog">取消</v-btn>

        <v-btn v-if="isEdit" variant="flat" color="primary" @click="saveEdit"> 儲存 </v-btn>

        <v-btn v-else variant="flat" color="primary" @click="saveCreate"> 新增 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { useProductRules } from '@/utils/rules'
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null,
  },
})

const formRef = ref(null)
const formValid = ref(false)

const emit = defineEmits(['update:selectedCategory'])

const rules = useProductRules()
const dialog = useDialogStore()

const upsertDialog = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const categories = ref([])
const categoryName = ref('')
const search = ref('')

const filteredCategories = computed(() => {
  const list = categories.value ?? []
  const keyword = search.value?.trim().toLowerCase()

  if (!keyword) return list
  return list.filter((c) => c.name?.toLowerCase().includes(keyword))
})

// ✨ 使用者點某個分類時
function handleSelect(category) {
  emit('update:selectedCategory', category) // 通知父元件：選到哪個分類
}

async function fetchData() {
  dialog.showLoading()
  try {
    const { data } = await api.get('/ConsultantCategory')
    categories.value = data ?? []
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    dialog.hideLoading()
  }
}

async function fetchDataById(id) {
  dialog.showLoading()
  try {
    const { data } = await api.get(`/ConsultantCategory/${id}`)
    categoryName.value = data.name
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    dialog.hideLoading()
  }
}

async function openEdit(id) {
  editingId.value = id
  isEdit.value = true
  await fetchDataById(id)
  upsertDialog.value = true
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  categoryName.value = ''
  upsertDialog.value = true
}

function handleCloseDialog() {
  upsertDialog.value = false
  categoryName.value = ''
  editingId.value = null
}

async function saveEdit() {
  if (!editingId.value) return
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  try {
    const payload = { name: categoryName.value }
    await api.put(`/ConsultantCategory/${editingId.value}`, payload)
    await fetchData()
    handleCloseDialog()
  } catch (err) {
    dialog.showAxiosError(err, '資料編輯失敗')
  }
}

async function saveCreate() {
  const result = await formRef.value?.validate()
  if (!result?.valid) return
  try {
    const payload = { name: categoryName.value }
    await api.post('/ConsultantCategory', payload)
    await fetchData()
    handleCloseDialog()
  } catch (err) {
    dialog.showAxiosError(err, '資料新增失敗')
  }
}

async function confirmDelete(id) {
  const ok = await dialog.askConfirm({
    title: '刪除顧問師分類',
    message: '確定要刪除這個顧問師分類嗎？',
    isDelete: true,
  })

  if (!ok) return

  dialog.showLoading()
  try {
    await api.delete(`/ConsultantCategory/${id}`)
    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '刪除顧問師分類失敗')
  } finally {
    dialog.hideLoading()
  }
}

onMounted(fetchData)
</script>

<style scoped>
.is-active {
  background-color: rgba(25, 118, 210, 0.08);
}

.category-row {
  cursor: pointer;
}

/* 整體 panel 外框、背景、邊線 */
.category-panel {
  min-height: 100vh;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #fff;
}

/* 上方區塊：有固定 padding，下面留空間給列表 */
.category-panel__header {
  padding: 16px;
}

/* 列表區：撐滿剩餘空間，可以滾動 */
.category-panel__body {
  flex: 1;
  overflow-y: auto;
}

/* 名稱欄 + 操作欄排版 */
.category-table__name {
  padding-left: 16px;
}

.category-table__actions {
  text-align: right;
  padding-right: 8px;
  width: 80px;
}

/* 補最後一列的下邊框 */
:deep(.category-table > .v-table__wrapper > table > tbody > tr > td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
