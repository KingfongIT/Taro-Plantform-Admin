<template>
  <v-container fluid class="pa-6">
    <div class="main-title">
      <h2>外部會員</h2>
    </div>
    <v-row>
      <v-col>
        <v-card border>
          <v-card-title>
            <div class="d-flex justify-end align-center">
              <v-btn
                class="mr-4"
                @click="addDialog = true"
                color="primary"
                value="flat"
                variant="flat"
                >新增會員</v-btn
              >
              <v-text-field
                v-model="searchKeyword"
                prepend-inner-icon="search"
                label="搜尋名稱"
                hide-details
                density="compact"
                max-width="300"
              ></v-text-field>
            </div>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="serverItems"
            item-key="id"
            :search="searchKeyword"
            @update:options="loadItems()"
            @click:row="(_, { item }) => goToDetail(item)"
            hover
            style="cursor: pointer"
          >
            <template #item.updateAt="{ item }">
              {{ formatDate(item.updateAt) }}
            </template>
            <template #item.isActive="{ item }">
              <v-chip
                :color="getStatusColor(item.isActive)"
                :prepend-icon="getStatusIcon(item.isActive)"
              >
                {{ getStatusText(item.isActive) }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <div class="d-flex justify-end align-center">
                <v-btn
                  color="warning"
                  variant="text"
                  size="small"
                  prepend-icon="block"
                  :disabled="!item.isActive"
                  @click.stop="restore(item)"
                  class="mr-2"
                >
                  停用
                </v-btn>
                <v-btn
                  color="error"
                  variant="text"
                  size="small"
                  prepend-icon="delete"
                  @click.stop="confirmDelete(item)"
                >
                  刪除
                </v-btn>
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
      </v-col>
    </v-row>
  </v-container>

  <!-- 新增 Dialog -->
  <v-dialog v-model="addDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 ps-2">新增外部會員</div>
        <v-btn icon="close" variant="text" @click="addDialog = false" />
      </v-card-title>

      <v-card-text>
        <v-text-field label="姓名或公司名稱" clearable v-model="member.name" />
        <v-text-field label="Email" clearable v-model="member.email" />
        <v-text-field label="銀行代號" clearable v-model="member.bankCode" />
        <v-text-field label="銀行帳號" clearable v-model="member.bankAccount" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="addDialog = false" color="secondary" variant="flat">取消</v-btn>
        <v-btn :loading="savingEdit" @click="addMember" color="primary" variant="flat">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import router from '@/router'
import api from '@/plugins/api'
import dayjs from 'dayjs'
import { useDialogStore } from '@/stores/dialog'

const dialog = useDialogStore()

/* 新增外部會員 */
const addDialog = ref(false)
const member = ref({
  name: '',
  email: '',
  bankCode: '',
  bankAccount: '',
  isActive: true,
})
async function addMember() {
  try {
    if (member.value.name == '') return '請輸入名稱'
    const { data } = await api.post('/ExternalMember/Create', {
      name: member.value.name,
      email: member.value.email,
      bankCode: member.value.bankCode,
      bankAccount: member.value.bankAccount,
      isActive: member.value.isActive,
    })
    serverItems.value.push(data)
    member.value = {
      name: '',
      email: '',
      bankCode: '',
      bankAccount: '',
      isActive: true,
    }
    addDialog.value = false
  } catch (error) {
    console.log(error)
  }
}

//日期樣式
function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

function getStatusIcon(status) {
  if (status) {
    return 'check_circle'
  }
  return 'block'
}

function getStatusText(status) {
  if (status) {
    return '正常'
  }
  return '停權'
}

function getStatusColor(status) {
  if (status) {
    return 'success'
  }
  return 'error'
}

const headers = [
  { title: '名稱', value: 'name' },
  { title: '信箱', value: 'email' },
  { title: '狀態', value: 'isActive' },
  { title: '更新日期', value: 'updateAt' },
  { title: '操作', value: 'actions', sortable: false, align: 'end' },
]

const serverItems = ref([])
const loading = ref(true)
const searchKeyword = ref('')

async function loadItems() {
  loading.value = true

  const res = await api.get('/ExternalMember/Get')

  console.log(res.data)
  serverItems.value = res.data

  loading.value = false
}

//跳轉詳情頁
function goToDetail(item) {
  console.log(item.id)
  router.push({ name: 'externalMemberDetail', params: { id: item.id } })
}

/* 刪除 */
async function confirmDelete(item) {
  const ok = await dialog.askConfirm({
    title: '刪除確認',
    message: '確定要刪除這個會員嗎？此動作無法復原。',
  })
  if (!ok) return
  try {
    await api.delete(`/ExternalMember/Delete/${item.id}`)

    const idx = serverItems.value.findIndex((x) => x.id === item.id)
    if (idx !== -1) serverItems.value.splice(idx, 1)
  } catch (error) {
    console.log(error)
  }
}

/* 停用 */
async function restore(item) {
  if (!item.isActive) return

  const ok = await dialog.askConfirm({
    title: '停用確認',
    message: '確定要停用這個會員嗎？',
  })

  if (!ok) return
  try {
    await api.patch(`/ExternalMember/Disable/${item.id}`)

    item.isActive = false
  } catch (error) {
    console.log(error)
  }
}
</script>
<style scoped lang="scss">
.custom-table :deep(table thead) {
  background-color: #f5f5f5;
  color: #333;
}
</style>
