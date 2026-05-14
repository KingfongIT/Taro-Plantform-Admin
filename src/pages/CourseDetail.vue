<template>
  <v-container>
    <v-row>
      <v-col><v-btn variant="tonal" :to="{ name: 'Course' }">返回列表</v-btn> </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" v-for="t in draft" :key="t.specTypeId">
        <v-card border>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="text-h6">{{ t.specTypeName }}</div>
            <div class="text-caption text-medium-emphasis">拖拉可調整排序</div>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- 用 vuedraggable 控制 t.values -->
            <draggable
              v-model="t.values"
              item-key="specValueId"
              handle=".drag-handle"
              :animation="180"
              @end="renumberSortOrder(t)"
            >
              <template #item="{ element: v, index }">
                <div class="d-flex align-center ga-3 py-2">
                  <!-- 拖拉把手 -->
                  <v-icon class="drag-handle" style="cursor: grab">drag_indicator</v-icon>

                  <!-- 名稱可編輯 -->
                  <v-textarea
                    v-model="v.specValueName"
                    auto-grow
                    rows="1"
                    label="規格值名稱"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 1000px"
                  />

                  <!-- SortOrder 可手改（可選：你也可以改成 readonly，完全交給拖拉） -->
                  <v-text-field
                    v-model.number="v.sortOrder"
                    label="排序"
                    type="number"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 120px"
                  />
                </div>
              </template>
            </draggable>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" class="d-flex ga-2 mb-4">
        <v-spacer></v-spacer>
        <v-btn color="primary" :loading="saving" :disabled="saving" @click="save"> 儲存 </v-btn>
        <v-btn variant="outlined" :disabled="saving" @click="resetDraft"> 重置 </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import draggable from 'vuedraggable'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref } from 'vue'

const props = defineProps({
  id: Number,
})

const dialog = useDialogStore()

const original = ref([])
const draft = ref([])
const saving = ref(false)

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

async function fetchData() {
  dialog.showLoading()
  try {
    const { data } = await api.get(`/Product/GetSpecValue/${props.id}`)
    console.log(data)
    original.value = data
    draft.value = deepClone(data)

    for (const t of draft.value) {
      t.values.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }
  } catch (error) {
    dialog.showAxiosError(error, '資料抓取錯誤')
  } finally {
    dialog.hideLoading()
  }
}

function renumberSortOrder(specType) {
  specType.values.forEach((v, idx) => {
    v.sortOrder = idx // 你要從 0 或 1 開始都行
  })
}

async function save() {
  dialog.showLoading()
  saving.value = true
  try {
    const items = []
    for (const t of draft.value) {
      for (const v of t.values) {
        items.push({
          specValueId: v.specValueId,
          specValueName: (v.specValueName || '').trim(),
          sortOrder: Number(v.sortOrder) || 0,
        })
      }
    }

    await api.put(`/Product/SpecValues/${props.id}`, items)
    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '資料更新錯誤')
  } finally {
    saving.value = false
    dialog.hideLoading()
  }
}

function resetDraft() {
  draft.value = deepClone(original.value)
  for (const t of draft.value) {
    t.values.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }
}

onMounted(fetchData)
</script>

<style scoped>
.page {
  padding: 16px;
}
.row-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
}
.drag-handle {
  cursor: grab;
}
.flex-1 {
  flex: 1;
}
.sort-hint {
  font-size: 12px;
  opacity: 0.7;
  min-width: 64px;
  text-align: right;
}
.actions {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 12px 0;
  display: flex;
  justify-content: flex-end;
}
</style>
