<template>
  <v-dialog v-model="dialogProxy" transition="dialog-bottom-transition" fullscreen>
    <v-card class="bg-secondary">
      <v-toolbar color="white">
        <v-btn icon="close" @click="dialogProxy = false"></v-btn>

        <v-toolbar-title> 系統等級排序 </v-toolbar-title>

        <v-toolbar-items>
          <v-btn text="儲存" color="primary" variant="text" @click="save()"></v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <v-container>
        <v-card variant="flat" class="pa-4">
          <p class="text-end text-error">*數字越大代表版本權限越大</p>
          <v-card class="mb-4">
            <!-- ProductName 在同一個框 -->
            <v-card-title class="d-flex bg-secondary">
              <p>商品名稱-規格</p>
              <v-spacer></v-spacer>
              <p>排序</p>
            </v-card-title>

            <v-divider />

            <div v-for="item in variants" :key="item.variantId">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <span>
                    <v-chip class="mr-2" :color="colorForProductName(item.ProductName)">{{
                      item.ProductName
                    }}</v-chip>
                    {{ item.SpecValueAName }}
                  </span>
                  <div>
                    <v-number-input
                      v-model.number="item.Level"
                      single-line
                      width="250"
                      controlVariant="split"
                      hide-details
                    />
                  </div>
                </div>
              </v-card-text>
              <v-divider />
            </div>
          </v-card>
        </v-card>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  dialog: Boolean,
})
const emit = defineEmits(['update:dialog'])

const dialogProxy = computed({
  get: () => props.dialog,
  set: (v) => emit('update:dialog', v),
})
const dialog = useDialogStore()

const variants = ref([])

/* 顏色盤 */
const chipColors = ['primary', 'success', 'warning', 'purple', 'deep-purple', 'indigo', 'teal']

function hashStringToIndex(str, mod) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash % mod
}

function colorForProductName(name) {
  const idx = hashStringToIndex(name || '', chipColors.length)
  return chipColors[idx]
}

async function fetchData() {
  try {
    dialog.showLoading()
    const { data } = await api.get('/level')
    variants.value = data
    console.log(data)
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    dialog.hideLoading()
  }
}

async function save() {
  try {
    dialog.showLoading()

    const payload = variants.value.map((v) => ({
      variantId: v.VariantId,
      level: v.Level,
    }))

    await api.put('/level/reorder', payload)

    await fetchData()
  } catch (error) {
    dialog.showError('儲存失敗', error?.message || '請稍後再試')
  } finally {
    dialog.hideLoading()
  }
}

watch(
  () => props.dialog,
  async (newVal) => {
    console.log(newVal)
    if (newVal) {
      await fetchData()
    }
  },
)
</script>
