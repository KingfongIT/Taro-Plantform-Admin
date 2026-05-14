<template>
  <v-container fluid class="pa-0">
    <!-- Header -->
    <v-toolbar flat density="comfortable" class="px-4">
      <v-btn variant="text" :to="{ name: 'Role' }" prepend-icon="arrow_back">返回</v-btn>
      <v-toolbar-title class="text-h6">
        {{ isEdit ? '編輯角色' : '新增角色' }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn variant="text" @click="goBack">取消</v-btn>
      <v-btn color="primary" @click="submit">{{ isEdit ? '儲存' : '建立角色' }}</v-btn>
    </v-toolbar>

    <v-divider />

    <v-container class="py-6">
      <!-- 角色名稱 -->
      <v-text-field
        v-model="roleName"
        label="角色名稱"
        variant="outlined"
        density="comfortable"
        required
        class="mb-8"
      />

      <!-- 權限 -->
      <div class="mb-3 d-flex align-center">
        <v-icon class="me-2" color="primary">inventory</v-icon>
        <h2 class="text-h6">權限設定</h2>
      </div>

      <v-row>
        <v-col v-for="cat in permissionTree" :key="cat.category" cols="12" md="4">
          <!-- 用 v-sheet 取代 v-card -->
          <v-sheet border rounded class="overflow-hidden">
            <!-- 標題列 -->
            <div class="d-flex align-center px-4 py-2 bg-secondary">
              <v-checkbox
                class="me-2"
                density="compact"
                hide-details
                :model-value="cat.items.every((i) => selectedCodes.includes(i.code))"
                @update:modelValue="toggleCategory(cat)"
              />
              <div class="text-subtitle-1 font-weight-medium">{{ cat.category }}</div>

              <v-spacer />
              <div class="text-caption text-medium-emphasis">
                {{ countSelected(cat) }} / {{ cat.items.length }}
              </div>
            </div>

            <v-divider />

            <!-- 內容 -->
            <div class="px-4 py-3">
              <v-checkbox
                v-for="item in cat.items"
                :key="item.code"
                :label="item.name"
                :value="item.code"
                color="primary"
                v-model="selectedCodes"
                hide-details
                density="comfortable"
              />
            </div>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>

    <!-- 底部 actions（可要可不要；不要就刪掉整段） -->
    <div class="sticky-actions">
      <v-container class="py-3 d-flex justify-end ga-2">
        <v-btn variant="text" @click="goBack">取消</v-btn>
        <v-btn color="primary" @click="submit">{{ isEdit ? '儲存' : '建立角色' }}</v-btn>
      </v-container>
    </div>
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  id: { type: String, default: null },
})
const isEdit = computed(() => !!props.id)

const dialog = useDialogStore()
const router = useRouter()

const roleName = ref('')
const permissionTree = ref([])
const selectedCodes = ref([])

function goBack() {
  router.push({ name: 'Role' })
}

function toggleCategory(cat) {
  const codes = cat.items.map((i) => i.code)
  const allChecked = codes.every((c) => selectedCodes.value.includes(c))

  selectedCodes.value = allChecked
    ? selectedCodes.value.filter((c) => !codes.includes(c))
    : Array.from(new Set([...selectedCodes.value, ...codes]))
}

function countSelected(cat) {
  const set = new Set(selectedCodes.value)
  return cat.items.reduce((acc, it) => acc + (set.has(it.code) ? 1 : 0), 0)
}

async function fetchData() {
  dialog.showLoading()
  try {
    const { data } = await api.get(`/Permissions/`)
    permissionTree.value = data
  } catch (error) {
    dialog.showAxiosError(error, '資料抓取錯誤')
  } finally {
    dialog.hideLoading()
  }
}

async function fetchRoleDetail() {
  if (!isEdit.value) return

  dialog.showLoading()
  try {
    const { data } = await api.get(`/Permissions/${props.id}`)
    roleName.value = data.roleName
    selectedCodes.value = data.codes ?? []
  } catch (error) {
    dialog.showAxiosError(error, '角色資料抓取錯誤')
  } finally {
    dialog.hideLoading()
  }
}

async function submit() {
  if (!roleName.value) {
    alert('請輸入角色名稱')
    return
  }

  const payload = {
    name: roleName.value,
    permissionCodes: selectedCodes.value,
  }

  if (isEdit.value) {
    try {
      dialog.showLoading()
      await api.put(`/roles/${props.id}`, payload)
      await fetchRoleDetail()
    } catch (error) {
      dialog.showAxiosError(error, '更新失敗')
    } finally {
      dialog.hideLoading()
    }
  } else {
    try {
      dialog.showLoading()
      await api.post(`/roles`, payload)
      goBack()
    } catch (error) {
      dialog.showAxiosError(error, '新增失敗')
    } finally {
      dialog.hideLoading()
    }
  }
}

onMounted(async () => {
  await fetchData()
  await fetchRoleDetail()
})
</script>

<style scoped>
.sticky-actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
