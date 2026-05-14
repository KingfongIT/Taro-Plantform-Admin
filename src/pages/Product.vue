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

      <!-- 工具列 -->
      <v-card-title class="d-flex justify-space-between">
        <div class="d-flex align-center">
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
            v-model.lazy="search"
            prepend-inner-icon="search"
            label="搜尋名稱"
            hide-details
            density="compact"
            min-width="250"
          />
        </div>
      </v-card-title>

      <!-- 單一 DataTable（依 tab 切換查詢參數） -->
      <v-data-table
        class="custom-table"
        :headers="headers"
        :items="rows"
        :loading="loading"
        :search="search"
        hover
      >
        <template #item.actions="{ item }">
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
            <v-list density="compact" v-if="isOffice">
              <v-list-item @click.stop="editCourse(item.product.id)">
                <template #prepend><v-icon>edit</v-icon></template>
                <v-list-item-title>編輯</v-list-item-title>
              </v-list-item>
            </v-list>
            <v-list density="compact" v-else>
              <v-list-item @click.stop="edit(item.product.id)">
                <template #prepend><v-icon>edit</v-icon></template>
                <v-list-item-title>編輯</v-list-item-title>
              </v-list-item>

              <v-list-item @click.stop="archive(item.product.id)">
                <template #prepend
                  ><v-icon>{{ isValid ? 'archive' : 'unarchive' }}</v-icon></template
                >
                <v-list-item-title>{{ isValid ? '封存' : '還原' }}</v-list-item-title>
              </v-list-item>
              <!-- <v-list-item v-else @click.stop="restore(item)">
                <template #prepend><v-icon>unarchive</v-icon></template>
                <v-list-item-title>還原</v-list-item-title>
              </v-list-item> -->

              <v-list-item @click.stop="confirmDelete(item.product.id)">
                <template #prepend><v-icon color="error">delete</v-icon></template>
                <v-list-item-title class="text-error">刪除</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <template #no-data>
          <div class="text-center pa-6">
            <img src="/images/NoSearch.svg" />
            <h6 class="mt-2">搜尋無結果</h6>
          </div>
        </template>
        <template #item.detail="{ item }">
          <v-btn color="primary" variant="flat" @click="goToDetail(item.accountGuid)">詳情</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import router from '@/router'
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useDialogStore } from '@/stores/dialog'
import { useAuthStore } from '@/stores/auth'

/* ------ 身分認證 ----------- */
const authStore = useAuthStore()
const isOffice =
  authStore.hasPermission('COURSE_VIEW') && !authStore.hasPermission('PRODUCT_MANAGE_VIEW') //單一行政人員

/* ---------- UI 狀態 ---------- */

const dialog = useDialogStore()
const search = ref('')
const isValid = ref(true)

/** ✅ Vuetify 3 規格：陣列形式 [{ key, order: 'asc'|'desc' }] */
const loading = ref(false)
const rows = ref([])
const total = ref(0)

/* ---------- 表頭 ---------- */
const headers = [
  { title: '名稱', key: 'product.name' },
  { title: '分類', key: 'category.name' },
  {
    title: '最後編輯時間',
    key: 'product.updatedAt',
    value: (item) => formatDate(item.product.updatedAt),
  },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
]

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
function edit(id) {
  router.push({ name: 'ProductEdit', params: { id } })
}

function editCourse(id) {
  router.push({ name: 'CourseDetail', params: { id } })
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
</style>
