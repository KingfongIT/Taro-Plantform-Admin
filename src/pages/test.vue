<template>
  <v-container fluid class="pa-6 bg-secondary vh-100">
    <div class="main-title">
      <h2>公司收益報表</h2>
    </div>
    <!-- 服務收益 -->
    <div class="mb-6">
      <h3 class="text-primary mb-3">服務收益</h3>
      <v-row>
        <v-col>
          <v-card>
            <v-card-title class="d-flex">
              代理人行政費
              <v-spacer></v-spacer>
              <v-btn variant="tonal" prepend-icon="download">下載報表</v-btn>
            </v-card-title>
            <v-card-text>
              <div class="text-center mb-4">
                <div class="text-grey">總計</div>
                <div class="text-h4 font-weight-bold text-primary">$ 2,100,000</div>
              </div>
              <v-table>
                <thead class="bg-secondary">
                  <tr>
                    <th class="text-left">月份</th>
                    <th class="text-left">總計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in adminFee" :key="item.month">
                    <td>{{ item.month }}</td>
                    <td class="text-left">{{ item.total.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col>
          <!-- <v-card>
            <v-card-title class="d-flex">
              代理人行政費
              <v-spacer></v-spacer>
              <v-btn variant="tonal" prepend-icon="download">下載報表</v-btn>
            </v-card-title>
            <v-card-text>
              <div class="text-center mb-4">
                <div class="text-grey">總計</div>
                <div class="text-h4 font-weight-bold text-primary">$ 2,100,000</div>
              </div>
              <v-table>
                <thead class="bg-secondary">
                  <tr>
                    <th class="text-left">月份</th>
                    <th class="text-left">總計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in adminFee" :key="item.month">
                    <td>{{ item.month }}</td>
                    <td class="text-left">{{ item.total.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card> -->
        </v-col>
      </v-row>
    </div>
    <!-- 商品收益 -->
    <div class="mb-6">
      <h3 class="text-primary mb-3">服務收益</h3>
      <v-row>
        <v-col>
          <v-card>
            <v-card-title class="d-flex">
              代理人飼料過期
              <v-spacer></v-spacer>
              <v-btn variant="tonal" prepend-icon="download">下載報表</v-btn>
            </v-card-title>
            <v-card-text>
              <div class="text-center mb-4">
                <div class="text-grey">飼料過期總計</div>
                <div class="text-h4 font-weight-bold text-primary">$ 2,100,000</div>
              </div>
              <v-table>
                <thead class="bg-secondary">
                  <tr>
                    <th class="text-left">月份</th>
                    <th class="text-left">過期數量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in expiredToken">
                    <td>{{ item.year + '-' + item.month }}</td>
                    <td class="text-left">{{ item.amount }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col>
          <v-card>
            <v-card-title class="d-flex">
              管理費收入
              <v-spacer></v-spacer>
              <v-btn variant="tonal" prepend-icon="download">下載報表</v-btn>
            </v-card-title>
            <v-card-text>
              <div class="text-center mb-4">
                <div class="text-grey">總計</div>
                <div class="text-h4 font-weight-bold text-primary">$ 2,100,000</div>
              </div>
              <v-table>
                <thead class="bg-secondary">
                  <tr>
                    <th class="text-left">月份</th>
                    <th class="text-left">總計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in managementFee">
                    <td>{{ item.year + '-' + item.month }}</td>
                    <td class="text-left">{{ item.amount }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 管理費 -->
    <!-- <div class="mb-6">
      <h3 class="text-primary mb-3">管理費</h3>
      <v-row>
        <v-col>
          <v-card>
            <v-card-title class="d-flex align-center ga-3">
              <p>管理費分潤</p>
              <input
                ref="monthInput"
                type="month"
                v-model="yearMonth"
                :max="maxMonth"
                class="px-2 border rounded"
              />
              <v-btn variant="tonal" prepend-icon="download">下載報表</v-btn>
              <v-spacer></v-spacer>
              <v-text-field v-model="search" placeholder="搜尋姓名" hide-details></v-text-field>
            </v-card-title>
            <v-divider></v-divider>
            <v-data-table title="" :hearders="hearder"> </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </div> -->
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const dialog = useDialogStore()
const route = useRoute()

const expiredToken = ref([])
const managementFee = ref([])

const adminFee = ref([
  { month: '2024-01', total: 500000 },
  { month: '2024-02', total: 450000 },
  { month: '2024-03', total: 600000 },
  { month: '2024-04', total: 550000 },
])

const hearder = ref([
  { text: '月份', value: 'month' },
  { text: '總計', value: 'total' },
])

const yearMonth = ref('')

const maxMonth = computed(() => {
  const now = new Date()

  // 上個月
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 這裡不用 +1，因為要上個月

  const lastMonthDate = new Date(year, month, 1)

  return lastMonthDate.toISOString().slice(0, 7)
})

async function fetchData() {
  dialog.showLoading()
  await fetchLast12MonthExpiredToken()
  await fetchLast12MonthCommission()
  dialog.hideLoading()
}

async function fetchLast12MonthExpiredToken() {
  try {
    const { data } = await api.get('/Token/GetLast12MonthExpired')
    expiredToken.value = data
  } catch (error) {
    console.log(error)
  }
}

async function fetchLast12MonthCommission() {
  try {
    const { data } = await api.get('/Token/GetLast12MonthCommission')
    managementFee.value = data
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  fetchData()
})
</script>
