<template>
  <v-table hover>
    <thead class="bg-secondary">
      <tr>
        <th class="text-left">日期</th>
        <th class="text-left">原推薦人</th>
        <th class="text-left">變更後</th>
        <th class="text-left">編輯者</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in historyData" :key="item.id">
        <td>{{ useDateFormat(item.changeAt, 'YYYY/MM/DD HH:mm') }}</td>
        <td>{{ item.oldReferrerName }}</td>
        <td>{{ item.newReferrerName }}</td>
        <td>{{ item.changeName }}</td>
      </tr>
    </tbody>
  </v-table>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import api from '@/plugins/api'
import { useDateFormat } from '@/utils/formatDate'

const props = defineProps({
  agentGuid: String,
})

const historyData = ref([])
async function fetchData() {
  const { data } = await api.get(`/ReferrerHistory/${props.agentGuid}`)
  historyData.value = data
  console.log(data)
}

onMounted(() => {
  fetchData()
})
</script>
