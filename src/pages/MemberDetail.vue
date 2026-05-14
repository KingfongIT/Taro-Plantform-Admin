<template>
  <div class="pt-6 pl-6 main-title">
    <div class="d-flex align-center">
      <v-btn class="mr-3" prepend-icon="arrow_back" variant="tonal" @click="$router.back"
        >返回</v-btn
      >
      <h2>會員資料</h2>
    </div>
  </div>
  <v-tabs class="bg-secondary" color="primary" v-model="tab" grow>
    <v-tab value="profile">基本資料</v-tab>
    <v-tab value="agent">組織與代理</v-tab>
  </v-tabs>
  <v-window v-model="tab" class="pa-4">
    <v-window-item value="profile">
      <KeepAlive>
        <MemberProfile :guid="props.guid" />
      </KeepAlive>
    </v-window-item>

    <v-window-item value="agent">
      <MemberOrganize :guid="props.guid"></MemberOrganize>
    </v-window-item>
  </v-window>
</template>
<script setup>
import MemberOrganize from '@/components/MemberOrganize.vue'
import MemberProfile from '@/components/MemberProfile.vue'
import { ref } from 'vue'

const props = defineProps({
  guid: String,
})

const tab = ref('profile')
</script>
