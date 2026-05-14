<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card border>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3" color="primary">inventory</v-icon>
            基本資料
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col>
                <v-avatar color="surface-variant" size="120">
                  <FileImageComponent :fileId="memberDetail?.photoId"></FileImageComponent>
                </v-avatar>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-list lines="two">
                  <v-list-item>
                    <v-list-item-subtitle class="mb-1">姓名</v-list-item-subtitle>
                    <v-list-item-title>{{ memberDetail.name ?? '-' }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-subtitle class="mb-1">信箱</v-list-item-subtitle>
                    <v-list-item-title>{{ memberDetail.email ?? '-' }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-subtitle class="mb-1">地址</v-list-item-subtitle>
                    <v-list-item-title>{{ memberDetail.address ?? '-' }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col>
                <v-list lines="two">
                  <v-list-item>
                    <v-list-item-subtitle class="mb-1">性別</v-list-item-subtitle>
                    <v-list-item-title>{{ memberDetail.gender ?? '-' }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-subtitle class="mb-1">連絡電話</v-list-item-subtitle>
                    <v-list-item-title>{{ memberDetail.phone ?? '-' }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref } from 'vue'
import FileImageComponent from './FileImageComponent.vue'
const props = defineProps({
  guid: String,
})

const dialog = useDialogStore()

async function fetchMemberDetail() {
  dialog.showLoading()
  try {
    const { data } = await api.get(`/account/Get/${props.guid}`)
    memberDetail.value = data
  } catch (error) {
    dialog.showAxiosError(error, '載入會員資料失敗')
  } finally {
    dialog.hideLoading()
  }
}

const memberDetail = ref({})

onMounted(() => {
  fetchMemberDetail()
})
</script>
