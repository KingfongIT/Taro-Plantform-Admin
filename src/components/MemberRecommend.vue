<template>
  <v-card height="300" class="mx-auto" title="推薦人數排行">
    <template v-slot:append>
      <v-dialog max-width="500">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn variant="tonal" class="mr-2" v-bind="activatorProps">更多</v-btn>
        </template>
        <!-- 這邊是dialog -->
        <template v-slot:default="{ isActive }">
          <v-card>
            <!-- ✅ 固定標題 -->
            <v-card-title class="mt-3"> 推薦人數排行 </v-card-title>
            <!-- ✅ 可滾動內容 -->
            <v-card-text class="scrollable-content">
              <v-table class="custom-table">
                <thead>
                  <tr>
                    <th class="text-left">推薦人</th>
                    <th class="text-right">人數</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in rankingData" :key="item.referrerAccountGuid">
                    <td>{{ item.referrerName }}</td>
                    <td class="text-right">{{ item.count }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>

            <!-- ✅ 固定底部操作 -->
            <v-card-actions class="sticky-actions">
              <v-spacer />
              <v-btn @click="isActive.value = false">關閉</v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
      <div>
        <v-select
          v-model="timeRange"
          :items="rangeOptions"
          item-value="value"
          item-title="text"
          flat
          variant="solo-filled"
          density="compact"
          hide-details
        />
      </div>
    </template>
    <v-table class="px-3 py-3">
      <tbody>
        <tr v-for="item in rankingData.slice(0, 4)" :key="item.referrerAccountGuid">
          <td class="text-left">{{ item.referrerName }}</td>
          <td class="text-right">{{ item.count }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'

// 父元件傳過來資料
const props = defineProps({
  rankingData: {
    type: Array,
    default: () => [],
  },
})

// 傳去父元件的日期篩選
const emit = defineEmits(['rangeChanged'])

const timeRange = ref('1m')

let rangeOptions = [
  { text: '近 1 個月', value: '1m' },
  { text: '近半年', value: '6m' },
  { text: '近一年', value: '1y' },
]

watch(timeRange, (val) => {
  emit('rangeChanged', val)
})
</script>

<style scoped>
::v-deep(.custom-table thead th) {
  background-color: #f5f5f5;
  color: #333;
}
</style>
