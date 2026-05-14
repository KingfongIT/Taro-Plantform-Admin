<template>
  <!-- 標題 + 篩選 + 搜尋欄 -->
  <v-card-title class="d-flex align-center py-4">
    <div>{{ props.title }}</div>
    <div style="width: 150px; margin-left: 16px">
      <slot name="select_Slot"></slot>
    </div>
    <v-spacer />
    <slot name="search_Slot"></slot>
  </v-card-title>

  <!-- 主表格 -->
  <v-data-table-server
    class="custom-table"
    :headers="props.headers"
    :items="props.items"
    :item-value="props.itemKey"
    :items-length="props.totalCount"
    v-model:options="internalOptions"
    :items-per-page="internalOptions.itemsPerPage"
    :show-select="props.showCheckBox"
    select-strategy="all"
    :loading="props.loading"
    :expanded="props.expanded"
    :show-expand="props.showExpand"
    @update:expanded="$emit('update:expanded', $event)"
    hover
  >
    <!-- 操作按鈕 slot -->
    <template #item.actions="{ item }">
      <slot name="item.actions" :item="item" />
    </template>

    <!-- 例外:推廣中心審核用 -->
    <template #item.applyStatus="{ item }">
      <slot name="item.applyStatus" :item="item" />
    </template>

    <!-- 例外:推廣中心審核用 -->
    <template #item.status="{ item }">
      <slot name="item.status" :item="item" />
    </template>

    <!-- 例外:推廣中心審核用 -->
    <template #item.contractProfiles[0].isDataConfirmed="{ item }">
      <slot name="item.contractProfiles[0].isDataConfirmed" :item="item" />
    </template>

    <!-- 展開內頁 slot -->
    <template #expanded-row="{ columns, item }">
      <slot name="expanded-row" :columns="columns" :item="item" />
    </template>

    <template #item.detail="{ item }">
      <slot name="item.detail" :item="item" />
    </template>

    <!-- 無資料畫面 -->
    <template #no-data>
      <div class="text-center pa-6">
        <img src="/images/NoSearch.svg" />
        <h6 class="mt-2">搜尋無結果</h6>
      </div>
    </template>
  </v-data-table-server>
</template>

<script setup>
import { ref, watch } from 'vue'

//從父元件傳過來的
const props = defineProps({
  title: String,
  headers: Array,
  items: Array,
  itemKey: {
    type: String,
    default: 'id',
  },
  totalCount: Number,
  options: Object,
  showCheckBox: {
    type: Boolean,
    default: false,
  },
  showExpand: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  expanded: {
    type: Array,
    default: () => [],
  },
})

//傳過去父元件
const emits = defineEmits(['update:options', 'update:expanded'])

// 深拷貝 options 傳入 v-model（避免子元件改到父元件的引用）
const internalOptions = ref({ ...props.options })

// 通知父元件 options 更新
watch(
  internalOptions,
  (val) => {
    emits('update:options', val)
  },
  { deep: true },
)
</script>

<style scoped lang="scss">
.custom-table :deep(table thead) {
  background-color: #f5f5f5;
  color: #333;
}
</style>
