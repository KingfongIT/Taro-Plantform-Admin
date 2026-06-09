<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>管理員</h2>
    </div>
    <v-row>
      <v-col>
        <v-card border>
          <v-card-title class="d-flex align-center pe-2">
            全部
            <v-spacer />
            <v-btn
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

          <!-- 簡化：用 v-data-table (前端) -->
          <v-data-table
            :headers="headers"
            :items="serverItems"
            :loading="loading"
            :search="search"
            item-key="id"
            class="elevation-0"
            @click:row="(_, { item }) => openEdit(item.id)"
            hover
            style="cursor: pointer"
          >
            <template #item.roles="{ item }">
              <span v-if="item.roles && item.roles.length">
                {{ item.roles.map((r) => r).join('、') }}
              </span>
              <span v-else>—</span>
            </template>
            <template #item.isActive="{ item }">
              <v-chip
                variant="text"
                :color="item.isActive ? 'success' : 'error'"
                :prepend-icon="item.isActive ? 'check_circle' : 'block'"
                small
              >
                {{ item.isActive ? '正常' : '停用' }}
              </v-chip>
            </template>
            <template #item.emailConfirmed="{ item }">
              <v-chip
                variant="text"
                :color="item.emailConfirmed ? 'success' : 'warning'"
                :prepend-icon="item.emailConfirmed ? 'verified_user' : 'gpp_maybe'"
                small
              >
                {{ item.emailConfirmed ? '驗證成功' : '未驗證' }}
              </v-chip>
            </template>
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

                <v-list density="compact">
                  <v-list-item @click.stop="openEdit(item.id)">
                    <template #prepend><v-icon>edit</v-icon></template>
                    <v-list-item-title>編輯</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click.stop="resendEmail(item)">
                    <template #prepend><v-icon>email</v-icon></template>
                    <v-list-item-title>補發密碼</v-list-item-title>
                  </v-list-item>

                  <v-list-item @click.stop="disable(item)">
                    <template #prepend>
                      <v-icon v-if="item.isActive == true">block</v-icon>
                      <v-icon v-else>task_alt</v-icon>
                    </template>
                    <v-list-item-title v-if="item.isActive == true">停用</v-list-item-title>
                    <v-list-item-title v-else>啟用</v-list-item-title>
                  </v-list-item>

                  <v-list-item @click.stop="confirmDelete(item.id)">
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
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="UpsertDialog.open" width="auto">
    <CreateAdmin
      :mode="UpsertDialog.mode"
      :userId="UpsertDialog.userId"
      @close="UpsertDialog.open = false"
      @saved="handleSaved"
    />
  </v-dialog>
</template>

<script setup>
import CreateAdmin from '../components/UpsertAdmin.vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const dialog = useDialogStore()

const router = useRouter()
// 表格與搜尋
const serverItems = ref([])
const search = ref('')
const loading = ref(false)

// 控制「新增 / 編輯」共用 dialog
const UpsertDialog = ref({
  open: false,
  mode: 'create', // 'create' | 'edit'
  userId: null, // 編輯時帶入的 userId 資料
})

function openCreate() {
  UpsertDialog.value = {
    open: true,
    mode: 'create',
    userId: null,
  }
}

function openEdit(id) {
  UpsertDialog.value = {
    open: true,
    mode: 'edit',
    userId: id, // 直接把該列的使用者資料帶進去
  }
}

async function handleSaved() {
  await fetchData()
}

const headers = [
  { title: '名稱', key: 'userName', align: 'start', width: 150 },
  { title: '信箱', key: 'email', align: 'start' },
  { title: '權限', key: 'roles', align: 'start' },
  { title: '信箱驗證', key: 'emailConfirmed', align: 'start' },
  { title: '狀態', key: 'isActive', align: 'start' },
  { title: '操作', key: 'actions', width: 200, sortable: false },
]

async function fetchData() {
  loading.value = true
  try {
    const { data } = await api.get('/Admin')
    serverItems.value = data ?? []
  } catch (err) {
    dialog.showAxiosError(err, '讀取管理者列表失敗')
  } finally {
    loading.value = false
  }
}

async function confirmDelete(id) {
  const ok = await dialog.askConfirm({
    title: '刪除管理者',
    message: '確定要刪除這個管理者帳號嗎？',
    isDelete: true,
  })
  if (!ok) return
  dialog.showLoading()
  try {
    await api.delete(`/admin/${id}`)
    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '刪除管理者失敗')
  } finally {
    dialog.hideLoading()
  }
}

async function disable(item) {
  if (item.isActive) {
    const ok = await dialog.askConfirm({
      title: '停用管理者',
      message: '確定要停用這個管理者帳號嗎？',
      isDelete: true,
    })
    if (!ok) return
    dialog.showLoading()
    try {
      await api.patch(`/admin/disable/${item.id}`)
      await fetchData()
    } catch (err) {
      dialog.showAxiosError(err, '停用管理者失敗')
    } finally {
      dialog.hideLoading()
    }
  } else {
    const ok = await dialog.askConfirm({
      title: '啟用管理者',
      message: '確定要啟用這個帳號嗎？',
    })
    if (!ok) return
    dialog.showLoading()
    try {
      await api.patch(`/admin/disable/${item.id}`)
      await fetchData()
    } catch (err) {
      dialog.showAxiosError(err, '啟用管理者失敗')
    } finally {
      dialog.hideLoading()
    }
  }
}

async function resendEmail(item) {
  const ok = await dialog.askConfirm({
    title: '補發密碼設定信',
    message: `確定要重新寄送密碼設定信到 ${item.email} 嗎？`,
  })
  if (!ok) return

  dialog.showLoading()
  try {
    await api.post(`/admin/${item.id}/resend-activate`)
  } catch (err) {
    dialog.showAxiosError(err, '補發密碼設定信失敗')
  } finally {
    dialog.hideLoading()
  }
}

onMounted(async () => {
  await fetchData()
})
</script>
