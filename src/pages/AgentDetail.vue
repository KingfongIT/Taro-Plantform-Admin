<template>
  <div class="page-wrapper">
    <v-container fluid class="pa-6 pb-0">
      <div class="main-title flex-row align-center">
        <v-btn
          :width="100"
          class="mr-4"
          prepend-icon="arrow_back"
          variant="tonal"
          @click="router.back()"
          >返回</v-btn
        >
        <h2>代理人詳情</h2>
      </div>
      <v-tabs v-model="tab" align-tabs="center" grow color="primary">
        <v-tab v-for="t in tabs" :key="t.key" :value="t.key">
          {{ t.label }}
        </v-tab>
      </v-tabs>
    </v-container>
    <v-container fluid class="main pa-6">
      <component :is="comps[tab]" :id="id" />
    </v-container>
  </div>
</template>

<script setup>
import router from '@/router'
import { ref, computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => route.params.id)

const tabs = ref([
  { key: 'info', label: '基本資料' },
  { key: 'token', label: '雞肉飼料(佣金)' },
  // { key: 'payment', label: '繳費紀錄' },
  { key: 'lineOrder', label: '組織訂單' },
])

const comps = {
  info: defineAsyncComponent(() => import('@/components/AgentInfoComponent.vue')),
  token: defineAsyncComponent(() => import('@/components/AgentTokenComponent.vue')),
  // payment: defineAsyncComponent(() => import('@/components/AgentContractPayComponent.vue')),
  lineOrder: defineAsyncComponent(() => import('@/components/AgentLineOrderComponent.vue')),
}

const tab = ref('info')
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /*頁面最少全螢幕高度*/
}

.main {
  flex: 1 1 auto;
  background: rgb(var(--v-theme-secondary));
}
</style>
