<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>角色列表</h2>
    </div>
    <v-row>
      <v-col>
        <v-card border>
          <v-card-title class="d-flex align-center pe-2">
            <v-spacer />
            <v-btn
              prepend-icon="add"
              class="mr-3"
              color="primary"
              variant="flat"
              :to="{ name: 'RoleCreate' }"
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
            @click:row="(_, { item }) => onRowClick(item.id)"
            hover
            style="cursor: pointer"
            ><template #item.actions="{ item }">
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
                  <v-list-item :to="{ name: 'RoleEdit', params: { id: item.id } }">
                    <template #prepend><v-icon>edit</v-icon></template>
                    <v-list-item-title>編輯</v-list-item-title>
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
</template>
<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const dialog = useDialogStore()

const router = useRouter()
// 表格與搜尋
const serverItems = ref([])

function onRowClick(id) {
  router.push({ name: 'RoleEdit', params: { id } })
}
const search = ref('')
const loading = ref(false)

const headers = [
  { title: '名稱', key: 'name', align: 'start' },
  { title: '操作', key: 'actions', align: 'end', sortable: false },
]

async function fetchData() {
  loading.value = true
  try {
    const { data } = await api.get('/Roles')
    serverItems.value = data ?? []
  } catch (err) {
    dialog.showAxiosError(err, '讀取角色失敗')
  } finally {
    loading.value = false
  }
}

async function confirmDelete(id) {
  console.log(id)
  const ok = await dialog.askConfirm({
    title: '刪除管理者',
    message: '確定要刪除這個管理者帳號嗎？',
    isDelete: true,
  })
  if (!ok) return

  dialog.showLoading()
  try {
    await api.delete(`/roles/${id}`)
    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '刪除管理者失敗')
  } finally {
    dialog.hideLoading()
  }
}

onMounted(() => {
  fetchData()
})
</script>
