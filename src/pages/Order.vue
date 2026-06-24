<template>
  <v-container fluid class="pa-6">
    <div
      v-if="orderInfoDrawer.open"
      class="order-page-scrim"
      :class="{ 'scrim-with-member': memberInfoDrawer.open }"
      @click="closeAllDrawers"
    ></div>
    <div class="main-title">
      <h2>訂單案件</h2>
    </div>
    <v-card border>
      <v-tabs v-model="currentTab" color="primary" grow @update:model-value="onTabChange">
        <v-tab value="all">全部訂單</v-tab>
        <v-tab value="subscription">訂閱訂單</v-tab>
        <v-tab value="cancelled" color="red-darken-1">取消訂單</v-tab>
        <v-tab value="abnormal" color="error">異常訂單</v-tab>
      </v-tabs>
      <v-divider></v-divider>
      <v-card-title>
        <v-row>
          <v-col class="d-flex align-center py-6">
            <h3 class="mr-4">{{ tabTitle }}</h3>
            <v-date-input
              v-model="dateRange"
              class="mr-2"
              density="compact"
              label="訂單日期區間"
              prepend-icon=""
              prepend-inner-icon="$calendar"
              max-width="368"
              multiple="range"
              hide-details
              clearable
            ></v-date-input>
            <v-select
              v-model="selectedPaymentStatus"
              :items="paymentStatusOptions"
              density="compact"
              width="120"
              label="付款狀態篩選"
              chips
              multiple
              hide-details
              clearable
            ></v-select>
            <v-spacer></v-spacer>
            <!-- <v-btn
              v-if="authStore.hasPermission('ORDER_CASE_EDIT')"
              class="mr-2"
              prepend-icon="add"
              variant="flat"
              color="primary"
              >新增</v-btn
            > -->
            <!-- <v-btn
              v-if="authStore.hasPermission('ORDER_CASE_EDIT')"
              variant="flat"
              color="secondary"
              >匯出</v-btn
            > -->
            <div class="d-flex align-center ml-4" style="gap: 4px">
              <v-btn-toggle
                v-model="searchMode"
                mandatory
                density="compact"
                color="primary"
                variant="outlined"
                divided
              >
                <v-btn value="order" size="small">訂單/商品</v-btn>
                <v-btn value="sales" size="small">業務姓名</v-btn>
              </v-btn-toggle>
              <v-text-field
                v-model="search"
                prepend-inner-icon="search"
                :placeholder="searchMode === 'sales' ? '搜尋業務姓名' : '搜尋訂單編號、姓名、商品'"
                hide-details
                density="compact"
                min-width="320"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-title>
      <v-data-table-server
        v-model:page="options.page"
        v-model:sort-by="options.sortBy"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        must-sort
        item-value="name"
        @update:options="loadItems"
        @click:row="(_, { item }) => goToDetail(item.salesOrderId)"
        :row-props="getOrderRowProps"
        hover
        style="cursor: pointer"
      >
        <template #item.orderStatus="{ item }">
          <v-chip v-bind="formatOrderStatus(item.orderStatus)">
            {{ formatOrderStatus(item.orderStatus).text }}
          </v-chip>
        </template>
        <template #item.abnormalStatus="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-chip v-if="item.isRevenueMismatch" size="small" color="error" variant="tonal">
              分潤不同
            </v-chip>
            <v-chip v-if="item.isSpecMismatch" size="small" color="warning" variant="tonal">
              規格不同
            </v-chip>
            <span v-if="!item.isRevenueMismatch && !item.isSpecMismatch">-</span>
          </div>
        </template>
        <template #item.paymentStatus="{ item }">
          <v-chip
            :variant="getpayStateVariant(item.paymentStatus)"
            :color="getpayStateColor(item.paymentStatus)"
          >
            {{ getpayStateWorld(item.paymentStatus) }}
          </v-chip>
        </template>
        <template #item.subscriptionStatus="{ item }">
          <v-chip
            v-if="getSub(item).status"
            :color="formatSubscriptionStatus(getSub(item).status).color"
            variant="tonal"
            size="small"
          >
            {{ formatSubscriptionStatus(getSub(item).status).text }}
          </v-chip>
          <span v-else>-</span>
        </template>
        <template #item.subscriptionPeriods="{ item }">
          {{ formatSubscriptionPeriods(item) }}
        </template>
        <template #item.buyerName="{ item }">
          <div @click.stop="copyToClipboard(item.buyerName, '訂單姓名')" class="copy-cell">
            {{ item.buyerName || '-' }}
          </div>
        </template>
        <template #item.orderNo="{ item }">
          <div @click.stop="copyToClipboard(item.orderNo, '訂單編號')" class="copy-cell text-mono">
            {{ item.orderNo || '-' }}
          </div>
        </template>
        <template #item.primarySalesName="{ item }">
          <v-btn
            variant="outlined"
            color="primary"
            size="default"
            class="px-3"
            @click.stop="onSalesNameClick(item)"
          >
            {{ item.primarySalesName || '-' }}
          </v-btn>
        </template>
        <template #item.isEndCase="{ item }">
          <div @click.stop>
            <v-checkbox
              color="primary"
              v-model="item.isEndCase"
              hide-details
              @update:modelValue="onToggleEndCase(item.salesOrderId, item.isEndCase)"
            ></v-checkbox>
          </div>
        </template>
        <template #no-data>
          <div class="text-center pa-6">
            <img src="/images/NoSearch.svg" />
            <h6 class="mt-2">搜尋無結果</h6>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-navigation-drawer
      v-model="orderInfoDrawer.open"
      location="right"
      temporary
      width="560"
      class="order-info-drawer"
    >
      <div class="pa-4">
        <div class="order-info-header">
          <div class="d-flex align-center mb-3">
            <div>
              <div class="text-h6 font-weight-bold">訂單資料</div>
              <div class="text-caption text-medium-emphasis">
                {{ orderInfoDrawer.order?.orderNo || '未選擇訂單' }}
              </div>
            </div>
            <v-spacer />
            <v-btn icon="close" variant="text" @click="orderInfoDrawer.open = false"></v-btn>
          </div>

          <v-alert
            v-if="copiedFieldName"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            已複製：{{ copiedFieldName }}
          </v-alert>
        </div>

        <v-progress-linear v-if="orderInfoDrawer.loading" indeterminate color="primary" />

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="section in orderInfoSections"
            :key="section.title"
            variant="outlined"
            class="order-info-section"
          >
            <v-card-title class="text-subtitle-1 font-weight-bold">{{
              section.title
            }}</v-card-title>
            <v-table density="compact">
              <tbody>
                <tr v-for="field in section.fields" :key="field.label">
                  <th class="text-no-wrap">{{ field.label }}</th>
                  <td>
                    <v-chip
                      v-if="field.kind === 'status'"
                      :color="getDrawerStatusColor(field.value)"
                      variant="tonal"
                      size="small"
                    >
                      {{ translateDrawerStatus(field.value) }}
                    </v-chip>
                    <button
                      v-else-if="field.kind === 'email'"
                      type="button"
                      class="copy-value-button email-value-button"
                      @click="openMemberInfoDrawerByEmail(field.value)"
                    >
                      {{ displayDrawerValue(field.value) }}
                    </button>
                    <button
                      v-else
                      type="button"
                      class="copy-value-button"
                      :class="{ copied: copiedFieldName === field.label }"
                      @click="copyDrawerValue(field.label, field.value)"
                    >
                      {{ displayDrawerValue(field.value) }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </div>
      </div>
    </v-navigation-drawer>

    <Teleport to="body">
      <Transition name="member-drawer">
        <div v-if="memberInfoDrawer.open" class="member-info-drawer">
          <div class="pa-4">
            <div class="member-info-header">
              <div class="d-flex align-center mb-3">
                <div>
                  <div class="text-h6 font-weight-bold">會員資料</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ memberInfoDrawer.email || '未選擇會員' }}
                  </div>
                </div>
                <v-spacer />
                <v-btn icon="close" variant="text" @click="memberInfoDrawer.open = false"></v-btn>
              </div>

              <v-alert
                v-if="memberCopiedFieldName"
                type="success"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                已複製：{{ memberCopiedFieldName }}
              </v-alert>
            </div>

            <v-progress-linear v-if="memberInfoDrawer.loading" indeterminate color="primary" />

            <div v-else class="d-flex flex-column ga-3">
              <v-card variant="outlined" class="order-info-section">
                <v-card-title class="text-subtitle-1 font-weight-bold">會員資料</v-card-title>
                <v-table density="compact">
                  <tbody>
                    <tr v-for="field in memberProfileFields" :key="field.label">
                      <th class="text-no-wrap">{{ field.label }}</th>
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === field.label }"
                          @click="copyMemberDrawerValue(field.label, field.value)"
                        >
                          {{ displayDrawerValue(field.value) }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>

              <v-card variant="outlined" class="order-info-section">
                <v-card-title class="text-subtitle-1 font-weight-bold">組織線上線</v-card-title>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th style="width: 44px">層級</th>
                      <th style="width: 80px">姓名</th>
                      <th>Email</th>
                      <th style="width: 110px">位階</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="memberInfoDrawer.upline.length === 0">
                      <td colspan="4" class="text-medium-emphasis">-</td>
                    </tr>
                    <tr
                      v-for="(item, index) in memberInfoDrawer.upline"
                      :key="item.accountGuid || index"
                    >
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === `上線${index + 1}層級` }"
                          @click="copyMemberDrawerValue(`上線${index + 1}層級`, index + 1)"
                        >
                          {{ index + 1 }}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === `上線${index + 1}姓名` }"
                          @click="copyMemberDrawerValue(`上線${index + 1}姓名`, item.realName)"
                        >
                          {{ item.realName || '-' }}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === `上線${index + 1}Email` }"
                          @click="copyMemberDrawerValue(`上線${index + 1}Email`, item.email)"
                        >
                          {{ item.email || '-' }}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === `上線${index + 1}位階` }"
                          @click="
                            copyMemberDrawerValue(`上線${index + 1}位階`, item.template?.name)
                          "
                        >
                          {{ item.template?.name || '-' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>

              <v-card variant="outlined" class="order-info-section">
                <v-card-title class="text-subtitle-1 font-weight-bold">組織線下線</v-card-title>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th style="width: 80px">姓名</th>
                      <th>Email</th>
                      <th style="width: 100px">推薦日期</th>
                      <th style="width: 56px">有下線</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="memberInfoDrawer.downline.length === 0">
                      <td colspan="4" class="text-medium-emphasis">-</td>
                    </tr>
                    <tr
                      v-for="(item, index) in memberInfoDrawer.downline"
                      :key="item.referredAccountGuid || index"
                    >
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === `下線${index + 1}姓名` }"
                          @click="copyMemberDrawerValue(`下線${index + 1}姓名`, item.referredName)"
                        >
                          {{ item.referredName || '-' }}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === `下線${index + 1}Email` }"
                          @click="
                            copyMemberDrawerValue(`下線${index + 1}Email`, item.referredEmail)
                          "
                        >
                          {{ item.referredEmail || '-' }}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="copy-value-button"
                          :class="{ copied: memberCopiedFieldName === `下線${index + 1}推薦日期` }"
                          @click="
                            copyMemberDrawerValue(
                              `下線${index + 1}推薦日期`,
                              drawerDateOnly(item.referralDate),
                            )
                          "
                        >
                          {{ drawerDateOnly(item.referralDate) || '-' }}
                        </button>
                      </td>
                      <td>
                        <v-chip
                          size="small"
                          variant="tonal"
                          :color="item.hasChildren ? 'success' : 'grey'"
                        >
                          {{ item.hasChildren ? '是' : '否' }}
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div
      v-if="rowMenu.open"
      class="row-link-menu"
      :style="{ left: `${rowMenu.x}px`, top: `${rowMenu.y}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <button type="button" @click="openMenuLink('_blank')">在新分頁開啟</button>
      <button type="button" @click="openMenuLink('_self')">在目前分頁開啟</button>
      <button type="button" @click="copyMenuLink">複製連結</button>
    </div>

    <v-snackbar
      v-model="showCopySnackbar"
      location="top"
      color="success"
      timeout="2000"
      variant="tonal"
    >
      {{ copySnackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import api from '@/plugins/api'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import router from '@/router'
import { useRoute } from 'vue-router'
import { useDialogStore } from '@/stores/dialog'
import { useAuthStore } from '@/stores/auth'

function checks() {
  console.log(dateRange.value[0], dateRange.value[dateRange.value.length - 1])
  //   console.log(selectedPaymentStatus.value)
}

/* ------ 身分認證 ----------- */
const authStore = useAuthStore()

const dialog = useDialogStore()

/*----- orderStatus的v-chip顏色 -----*/
function formatOrderStatus(status) {
  if (status === 'COMPLETED') {
    return { text: '已審核', color: 'primary', variant: 'tonal' }
  }
  if (status === 'CANCELLED') {
    return { text: '已取消', color: 'error', variant: 'tonal' }
  }
  return { text: '未審核', color: '', variant: 'text' }
}

/*----- payState的v-chip顏色 -----*/
function getpayStateColor(state) {
  if (state == 'PAID') {
    return 'success'
  } else if (state == 'FAILED') {
    return 'error'
  } else if (state == 'UNPAID') {
    return 'primary'
  }
}

function getpayStateVariant(state) {
  if (state == 'UNPAID') {
    return 'text'
  }
}

function getpayStateWorld(state) {
  if (state == 'PAID') {
    return '已付款'
  } else if (state == 'FAILED') {
    return '付款異常'
  } else if (state == 'UNPAID') {
    return '待付款'
  } else if (state == 'REFUNDED') {
    return '已退款'
  } else {
    return '退款中'
  }
}

/*----- 訂閱資訊（移植自 OrderDetail.vue，邏輯一致）-----*/
// 唯一取值點：後端確定欄位後只需改這裡
function getSub(item) {
  return item?.subscription ?? {}
}

// 訂閱狀態翻譯（依藍新定期定額委託狀態）
function formatSubscriptionStatus(status) {
  const map = {
    ACTIVE: { text: '進行中', color: 'success' },
    CREATED: { text: '已建立', color: 'info' },
    PENDING: { text: '待處理', color: 'warning' },
    PAUSED: { text: '暫停', color: 'warning' },
    SUSPENDED: { text: '暫停', color: 'warning' },
    EXPIRING: { text: '已停止（效期內）', color: 'warning' },
    EXPIRED: { text: '已停止', color: 'grey' },
    CANCELED: { text: '已停止', color: 'grey' },
    CANCELLED: { text: '已停止', color: 'grey' },
    FAILED: { text: '扣款失敗', color: 'error' },
  }
  const key = String(status || '').toUpperCase()
  return map[key] ?? { text: status || '-', color: 'grey' }
}

// 訂閱週期翻譯（依藍新 PeriodType/PeriodPoint）：每月 9 號、每週 星期一、每年 03/12
function formatSubscriptionPeriod(item) {
  const sub = getSub(item)
  const type = String(sub.periodType || '').toUpperCase()
  const point = sub.periodPoint
  if (!type) return '-'
  switch (type) {
    case 'D':
      return point ? `每 ${point} 天` : '每日'
    case 'W': {
      const week = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日' }
      return point ? `每週 星期${week[Number(point)] ?? point}` : '每週'
    }
    case 'M':
      return point ? `每月 ${point} 號` : '每月'
    case 'Y': {
      const p = String(point ?? '')
      if (p.length === 4) return `每年 ${p.slice(0, 2)}/${p.slice(2)}`
      return point ? `每年 ${point}` : '每年'
    }
    default:
      return point ? `${sub.periodType} ${point}` : sub.periodType
  }
}

// 已付期數：優先用後端 paidPeriods，否則退而計算 charges 中 PAID 的數量
function getPaidPeriods(sub) {
  if (Number.isFinite(Number(sub?.paidPeriods))) return Number(sub.paidPeriods)
  const charges = Array.isArray(sub?.charges) ? sub.charges : []
  return charges.filter((c) => String(c?.status || '').toUpperCase() === 'PAID').length
}

// 總期數：優先用 periodTimes，否則退而用 charges 長度
function getTotalPeriods(sub) {
  const periodTimes = Number(sub?.periodTimes)
  if (Number.isFinite(periodTimes) && periodTimes > 0) return periodTimes
  return Array.isArray(sub?.charges) ? sub.charges.length : 0
}

function formatSubscriptionPeriods(item) {
  const sub = getSub(item)
  const total = getTotalPeriods(sub)
  if (!sub.periodTimes && !sub.paidPeriods && !sub.charges) return '-'
  return `${getPaidPeriods(sub)} / ${total}`
}

const paymentStatusOptions = ref([
  { title: '待付款', value: 'UNPAID' },
  { title: '已付款', value: 'PAID' },
  { title: '付款異常', value: 'FAILED' },
  { title: '退款中', value: 'REFUNDING' },
  { title: '已退款', value: 'REFUNDED' },
])

function formatDate(dateString) {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD')
}

/* -------- 從 URL query 還原狀態 -------- */
const route = useRoute()

function readQueryState() {
  const q = route.query
  const sortKey = q.sort ?? 'createdAt'
  const isDesc = q.sort ? (q.desc === 'true') : true
  const sortBy = [{ key: sortKey, order: isDesc ? 'desc' : 'asc' }]
  return {
    search: q.q ?? '',
    searchMode: q.mode === 'sales' ? 'sales' : 'order',
    tab: ['all', 'cancelled', 'abnormal', 'subscription'].includes(q.tab) ? q.tab : 'all',
    paymentStatus: q.pay ? String(q.pay).split(',') : [],
    page: Number(q.page) || 1,
    itemsPerPage: Number(q.size) || 50,
    startDate: q.from ?? null,
    endDate: q.to ?? null,
    sortBy: sortBy,
  }
}

const initState = readQueryState()

const currentTab = ref(initState.tab)
const dateRange = ref(
  initState.startDate && initState.endDate
    ? [new Date(initState.startDate), new Date(initState.endDate)]
    : undefined,
)
const selectedPaymentStatus = ref(initState.paymentStatus)
const searchMode = ref(initState.searchMode)
const baseHeaders = [
  {
    title: '訂單日期',
    align: 'start',
    sortable: true,
    key: 'createdAt',
    value: (item) => formatDate(item.createdAt),
  },
  { title: '狀態', key: 'orderStatus', align: 'end' },
  { title: '訂單編號', key: 'orderNo' },
  { title: '商品', key: 'detail.productName' },
  { title: '訂單姓名', key: 'buyerName' },
  { title: '業務姓名', key: 'primarySalesName', value: (item) => item.primarySalesName || '-' },
  { title: '訂單金額', key: 'totalAmount' },
  {
    title: '付款狀態',
    key: 'paymentStatus',
    align: 'end',
  },
  {
    title: '付款日期',
    key: 'payment.paidAt',
    align: 'end',
    value: (item) => formatDate(item.payment?.paidAt),
  },
  {
    title: '結案',
    key: 'isEndCase',
  },
  // { title: '合約書編號', key: 'contractNum', align: 'end' },
  // { title: '是否結案', key: 'isOver', align: 'end' },
]

// 訂閱訂單分頁：抽換掉單次付款相關欄位，改顯示訂閱狀態與期數/起訖日期
const subscriptionHeaders = [
  {
    title: '訂單日期',
    align: 'start',
    sortable: true,
    key: 'createdAt',
    value: (item) => formatDate(item.createdAt),
  },
  { title: '訂單編號', key: 'orderNo' },
  { title: '商品', key: 'detail.productName' },
  { title: '訂單姓名', key: 'buyerName' },
  { title: '業務姓名', key: 'primarySalesName', value: (item) => item.primarySalesName || '-' },
  { title: '訂閱狀態', key: 'subscriptionStatus', align: 'start', sortable: false },
  {
    title: '訂閱週期',
    key: 'subscriptionPeriod',
    align: 'start',
    sortable: false,
    value: (item) => formatSubscriptionPeriod(item),
  },
  { title: '已付/總期數', key: 'subscriptionPeriods', align: 'end', sortable: false },
  {
    title: '開始日期',
    key: 'subscriptionStartedAt',
    align: 'end',
    sortable: false,
    value: (item) => formatDate(getSub(item).startedAt) || '-',
  },
  {
    title: '結束日期',
    key: 'subscriptionEndedAt',
    align: 'end',
    sortable: false,
    value: (item) => {
      const sub = getSub(item)
      if (sub.endedAt) return formatDate(sub.endedAt)
      if (sub.nextChargeDate) return `${formatDate(sub.nextChargeDate)}（下次扣款）`
      return '-'
    },
  },
  { title: '訂單金額', key: 'totalAmount' },
  { title: '結案', key: 'isEndCase' },
]

const tabTitle = computed(() => {
  const map = {
    all: '全部',
    cancelled: '取消訂單',
    abnormal: '異常訂單',
    subscription: '訂閱訂單',
  }
  return map[currentTab.value] ?? '全部'
})

// 異常訂單分頁額外顯示「異常狀態」欄位；訂閱訂單分頁使用專屬欄位組
const headers = computed(() => {
  if (currentTab.value === 'subscription') return subscriptionHeaders
  if (currentTab.value !== 'abnormal') return baseHeaders
  const next = [...baseHeaders]
  next.splice(2, 0, { title: '異常狀態', key: 'abnormalStatus', align: 'start', sortable: false })
  return next
})

async function fetchData({ page, itemsPerPage, sortBy, search }) {
  loading.value = true
  try {
    const sortKey = sortBy[0]?.key
    const sortOrder = sortBy[0]?.order === 'desc'
    const range = dateRange.value ?? []
    const fromDate = range[0] ?? null
    const endDate = range.length > 0 ? range[range.length - 1] : null

    const params = {
      page: page,
      pageSize: itemsPerPage,
      sortBy: sortKey,
      sortDesc: sortOrder,
      searchKeyword: search,
      selectOptions: selectedPaymentStatus.value,
      startDate: fromDate,
      endDate: endDate,
      isValid: currentTab.value !== 'cancelled',
      abnormal: currentTab.value === 'abnormal',
      subscription: currentTab.value === 'subscription',
    }

    // 根據 searchMode 決定送哪個搜尋欄位
    if (searchMode.value) {
      params.searchField = searchMode.value
    }

    const { data } = await api.get(`/Order`, { params })
    console.log(data)

    serverItems.value = data.orders
    totalItems.value = data.totalCount
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    loading.value = false
  }
}

const itemsPerPage = ref(initState.itemsPerPage)
const search = ref(initState.search)
const serverItems = ref([])
const loading = ref(false)
const totalItems = ref(0)
const rowMenu = reactive({
  open: false,
  x: 0,
  y: 0,
  href: '',
})
const orderInfoDrawer = reactive({
  open: false,
  loading: false,
  order: null,
})
const memberInfoDrawer = reactive({
  open: false,
  loading: false,
  email: '',
  account: null,
  profile: null,
  upline: [],
  downline: [],
})
const showCopySnackbar = ref(false)
const copySnackbarText = ref('')

async function copyToClipboard(text, label) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copySnackbarText.value = `已複製${label}：${text}`
    showCopySnackbar.value = true
  } catch (err) {
    dialog.showError('複製失敗', '瀏覽器限制複製行為')
  }
}

async function onSalesNameClick(item) {
  if (item.primarySalesName) {
    await copyToClipboard(item.primarySalesName, '業務姓名')
  }
  openOrderInfoDrawer(item)
}

const copiedFieldName = ref('')
const memberCopiedFieldName = ref('')

const options = ref({
  page: initState.page,
  itemsPerPage: initState.itemsPerPage,
  sortBy: initState.sortBy,
  search: initState.search,
})

async function loadItems({ page, itemsPerPage, sortBy, search }) {
  options.value = { page, itemsPerPage, sortBy, search }
  syncQueryToUrl()
  await fetchData(options.value)
}

/* -------- 將篩選條件同步到 URL query -------- */
let skipQuerySync = false

function syncQueryToUrl() {
  if (skipQuerySync) return
  const range = dateRange.value ?? []
  const fromDate = range[0] ?? null
  const endDate = range.length > 0 ? range[range.length - 1] : null

  const query = {}
  if (search.value) query.q = search.value
  if (searchMode.value !== 'order') query.mode = searchMode.value
  if (currentTab.value !== 'all') query.tab = currentTab.value
  if (selectedPaymentStatus.value.length) query.pay = selectedPaymentStatus.value.join(',')
  if (options.value.page > 1) query.page = String(options.value.page)
  if (options.value.itemsPerPage !== 50) query.size = String(options.value.itemsPerPage)
  if (fromDate) query.from = dayjs(fromDate).format('YYYY-MM-DD')
  if (endDate) query.to = dayjs(endDate).format('YYYY-MM-DD')

  if (options.value.sortBy && options.value.sortBy.length) {
    query.sort = options.value.sortBy[0].key
    query.desc = String(options.value.sortBy[0].order === 'desc')
  }

  router.replace({ query })
}

function onFilterChange() {
  options.value.page = 1
  syncQueryToUrl()
  fetchData({ ...options.value, page: 1 })
}

watch(selectedPaymentStatus, onFilterChange)
watch(dateRange, onFilterChange)
watch(currentTab, onFilterChange)
watch(searchMode, onFilterChange)

/* -------- 切換 Tab -------- */
function onTabChange() {}

/* -------- 跳轉詳情頁 -------- */
function getOrderDetailHref(id) {
  const routeData = router.resolve({
    name: 'OrderDetail',
    params: { id },
  })

  return routeData.href
}

function goToDetail(id) {
  router.push({ name: 'OrderDetail', params: { id } })
}

async function openOrderInfoDrawer(item) {
  if (!item?.salesOrderId) return
  copiedFieldName.value = ''
  orderInfoDrawer.open = true
  orderInfoDrawer.loading = true
  orderInfoDrawer.order = null

  try {
    const { data } = await api.get(`/Order/${item.salesOrderId}`)
    orderInfoDrawer.order = data
  } catch (err) {
    dialog.showAxiosError(err, '訂單資料讀取失敗')
    orderInfoDrawer.open = false
  } finally {
    orderInfoDrawer.loading = false
  }
}

function displayDrawerValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

function drawerDate(value) {
  if (!value) return ''
  return dayjs(value).format('YYYY/MM/DD HH:mm')
}

function drawerDateOnly(value) {
  if (!value) return ''
  return dayjs(value).format('YYYY/MM/DD')
}

function drawerAddress(...parts) {
  return parts.filter(Boolean).join('')
}

function addDrawerField(fields, label, value) {
  fields.push({ label, value })
}

function addDrawerStatusField(fields, label, value) {
  fields.push({ label, value, kind: 'status' })
}

function addDrawerEmailField(fields, label, value) {
  fields.push({ label, value, kind: 'email' })
}

function translateDrawerStatus(value) {
  if (value === true) return '是'
  if (value === false) return '否'
  const map = {
    CREATED: '未審核',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    PAID: '已付款',
    UNPAID: '待付款',
    FAILED: '付款失敗',
    REFUNDING: '退款中',
    REFUNDED: '已退款',
    PRIMARY: '主要業務',
    SECONDARY: '次要業務',
  }
  return map[value] ?? displayDrawerValue(value)
}

function getDrawerStatusColor(value) {
  const map = {
    COMPLETED: 'success',
    PAID: 'success',
    PRIMARY: 'primary',
    CREATED: 'warning',
    UNPAID: 'warning',
    REFUNDING: 'warning',
    CANCELLED: 'error',
    FAILED: 'error',
    REFUNDED: 'grey',
    true: 'success',
    false: 'grey',
  }
  return map[String(value)] ?? 'primary'
}

function buildRevenueShareFields(revenueShares) {
  const fields = []
  if (!revenueShares) {
    addDrawerField(fields, '分潤模板', '')
    return fields
  }

  addDrawerField(fields, '分潤模板名稱', revenueShares.schemeName)
  addDrawerStatusField(fields, '是否分潤', revenueShares.isRevenueShare)
  addDrawerField(fields, '公司比例/金額', revenueShares.companyValue)
  addDrawerField(fields, '顧問分潤比例/金額', revenueShares.consultantValue)
  addDrawerField(fields, '講師分潤比例/金額', revenueShares.lecturerValue)
  addDrawerField(fields, '乙方名稱', revenueShares.partnerName)
  addDrawerField(fields, '乙方分潤比例/金額', revenueShares.partnerShareValue)
  addDrawerField(fields, '行政費類型', revenueShares.adminFeeType)
  addDrawerField(fields, '行政費數值', revenueShares.adminFeeValue)
  addDrawerField(fields, '使用費類型', revenueShares.usageFeeType)
  addDrawerField(fields, '使用費數值', revenueShares.usageFeeValue)
  addDrawerField(fields, '管理費類型', revenueShares.managementFeeType)
  addDrawerField(fields, '管理費數值', revenueShares.managementFeeValue)
  addDrawerField(fields, '分潤快照時間', drawerDate(revenueShares.snapshotAt))
  return fields
}

function buildMarketingCodeFields(marketingCodes = []) {
  const fields = []
  const sorted = [...marketingCodes].sort((a, b) => {
    const pos = Number(a.position ?? 0) - Number(b.position ?? 0)
    if (pos !== 0) return pos
    return (
      Number(a.salesOrderItemMarketingCodeId ?? 0) - Number(b.salesOrderItemMarketingCodeId ?? 0)
    )
  })

  sorted.forEach((code, index) => {
    const prefix = `業務${index + 1}`
    addDrawerStatusField(fields, `${prefix}角色`, code.role)
    addDrawerField(fields, `${prefix}順位`, code.position)
    addDrawerField(fields, `${prefix}姓名`, code.referrerNameSnapshot)
    addDrawerEmailField(fields, `${prefix}Email`, code.referrerEmailSnapshot)
    addDrawerField(fields, `${prefix}分配類型`, code.allocType)
    addDrawerField(fields, `${prefix}分配數值`, code.allocValue)
    addDrawerField(fields, `${prefix}備註`, code.allocNote)
    addDrawerStatusField(fields, `${prefix}已鎖定`, code.isLocked)
  })

  if (!fields.length) addDrawerField(fields, '業務分潤表', '')
  return fields
}

function buildPersonListFields(title, people = []) {
  const fields = []
  people.forEach((person, index) => {
    const prefix = `${title}${index + 1}`
    addDrawerField(fields, `${prefix}姓名`, person.name)
    addDrawerEmailField(fields, `${prefix}Email`, person.email)
    addDrawerField(fields, `${prefix}分潤值`, person.consultantValue ?? person.lecturerValue)
    addDrawerStatusField(fields, `${prefix}已付款`, person.isPaid)
  })
  if (!fields.length) addDrawerField(fields, title, '')
  return fields
}

const orderInfoSections = computed(() => {
  const order = orderInfoDrawer.order
  if (!order) return []

  const item = order.salesOrderItems ?? {}
  const sections = []

  const orderFields = []
  addDrawerField(orderFields, '訂單案件編號', order.orderNo)
  addDrawerField(orderFields, '案件編號', order.contractNumber)
  addDrawerField(orderFields, '訂單日期', drawerDate(order.orderDate))
  addDrawerStatusField(orderFields, '訂單狀態', order.orderStatus)
  addDrawerStatusField(orderFields, '付款狀態', order.paymentStatus)
  addDrawerField(orderFields, '付款方式', order.paymentMethodName)
  addDrawerField(orderFields, '訂單總金額', order.totalAmount)
  addDrawerStatusField(orderFields, '是否結案', order.isEndCase)
  addDrawerField(orderFields, '後台備註', order.adminRemark)
  sections.push({ title: '訂單案件', fields: orderFields })

  const invoiceFields = []
  addDrawerField(invoiceFields, '發票類別', order.invoiceType)
  addDrawerField(invoiceFields, '公司抬頭', order.companyTitle)
  addDrawerField(invoiceFields, '公司統編', order.companyTaxId)
  addDrawerField(
    invoiceFields,
    '發票地址',
    drawerAddress(order.invoiceCity, order.invoiceDistrict, order.invoiceAddress),
  )
  sections.push({ title: '發票', fields: invoiceFields })

  const formFields = []
  addDrawerField(formFields, '真實姓名', order.buyerName)
  addDrawerField(formFields, '性別', order.buyerGender)
  addDrawerField(formFields, '生日', drawerDateOnly(order.buyerBirthday))
  addDrawerField(formFields, '連絡電話', order.buyerPhone)
  addDrawerEmailField(formFields, '電子信箱', order.buyerEmail)
  addDrawerField(formFields, '身分證/統編', order.buyerIdNumber)
  addDrawerField(
    formFields,
    '地址',
    drawerAddress(order.buyerCity, order.buyerDistrict, order.buyerAddress),
  )
  addDrawerField(formFields, '公司名稱', order.buyerUnit)
  addDrawerField(formFields, '職稱', order.buyerTitle)
  addDrawerField(formFields, '備註', order.remark)
  sections.push({ title: '表單', fields: formFields })

  const productFields = []
  addDrawerField(productFields, '商品名稱', item.productName)
  addDrawerField(productFields, '規格', item.specSummary)
  addDrawerField(productFields, '商品單價', item.unitPrice)
  sections.push({
    title: '商品與分潤模板',
    fields: [...productFields, ...buildRevenueShareFields(item.revenueShares)],
  })

  sections.push({ title: '業務分潤表', fields: buildMarketingCodeFields(item.marketingCodes) })
  sections.push({ title: '顧問名單', fields: buildPersonListFields('顧問', order.consultants) })
  sections.push({ title: '講師名單', fields: buildPersonListFields('講師', order.lecturers) })

  const paymentFields = []
  ;(order.productOrderPayments ?? []).forEach((payment, index) => {
    const prefix = `付款紀錄${index + 1}`
    addDrawerField(paymentFields, `${prefix}金額`, payment.amount)
    addDrawerField(paymentFields, `${prefix}付款方式`, payment.paymentMethodName)
    addDrawerStatusField(paymentFields, `${prefix}狀態`, payment.status)
    addDrawerField(paymentFields, `${prefix}建立時間`, drawerDate(payment.createdAt))
    addDrawerField(paymentFields, `${prefix}失敗訊息`, payment.failureMessage)
  })
  if (!paymentFields.length) addDrawerField(paymentFields, '付款紀錄', '')
  sections.push({ title: '付款紀錄', fields: paymentFields })

  return sections
})

const memberProfileFields = computed(() => {
  const profile = memberInfoDrawer.profile ?? {}
  const account = memberInfoDrawer.account ?? {}
  return [
    { label: '姓名', value: profile.name ?? account.name },
    { label: 'Email', value: profile.email ?? account.email ?? memberInfoDrawer.email },
    { label: '電話', value: profile.phone },
    { label: '性別', value: profile.gender },
    { label: '地址', value: profile.address },
  ]
})

function resetMemberInfoDrawer(email = '') {
  memberCopiedFieldName.value = ''
  memberInfoDrawer.email = email
  memberInfoDrawer.account = null
  memberInfoDrawer.profile = null
  memberInfoDrawer.upline = []
  memberInfoDrawer.downline = []
}

function closeAllDrawers() {
  memberInfoDrawer.open = false
  orderInfoDrawer.open = false
}

async function findAccountByEmail(email) {
  const { data } = await api.get('/Account/Filter', {
    params: { search: email },
  })
  const rows = Array.isArray(data) ? data : []
  return (
    rows.find((row) => String(row.email || '').toLowerCase() === String(email).toLowerCase()) ??
    rows[0] ??
    null
  )
}

async function openMemberInfoDrawerByEmail(email) {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail || normalizedEmail === '-') return

  memberInfoDrawer.open = true
  memberInfoDrawer.loading = true
  resetMemberInfoDrawer(normalizedEmail)

  try {
    const account = await findAccountByEmail(normalizedEmail)
    if (!account?.guid) {
      dialog.showError('查無會員', `找不到 Email：${normalizedEmail}`)
      return
    }

    memberInfoDrawer.account = account
    const [profileRes, uplineRes, downlineRes] = await Promise.all([
      api.get(`/account/Get/${account.guid}`),
      api.get(`/OrgTree/GetUpline/${account.guid}`),
      api.get('/OrgTree/children', { params: { referrerGuid: account.guid } }),
    ])

    memberInfoDrawer.profile = profileRes.data ?? null
    memberInfoDrawer.upline = Array.isArray(uplineRes.data) ? uplineRes.data : []
    memberInfoDrawer.downline = Array.isArray(downlineRes.data) ? downlineRes.data : []
  } catch (err) {
    dialog.showAxiosError(err, '會員組織資料讀取失敗')
  } finally {
    memberInfoDrawer.loading = false
  }
}

async function copyDrawerValue(label, value) {
  const text = displayDrawerValue(value)
  if (text === '-') return
  try {
    await navigator.clipboard.writeText(text)
    copiedFieldName.value = label
  } catch {
    dialog.showError('複製失敗', '瀏覽器不允許直接複製這個欄位')
  }
}

async function copyMemberDrawerValue(label, value) {
  const text = displayDrawerValue(value)
  if (text === '-') return
  try {
    await navigator.clipboard.writeText(text)
    memberCopiedFieldName.value = label
  } catch {
    dialog.showError('複製失敗', '瀏覽器不允許直接複製這個欄位')
  }
}

function getOrderRowProps({ item }) {
  return {
    onContextmenu: (event) => openRowMenu(event, item.salesOrderId),
    onAuxclick: (event) => {
      if (event.button === 1) {
        event.preventDefault()
        window.open(getOrderDetailHref(item.salesOrderId), '_blank')
      }
    },
  }
}

function openRowMenu(event, id) {
  event.preventDefault()
  rowMenu.href = getOrderDetailHref(id)
  rowMenu.x = Math.min(event.clientX, window.innerWidth - 190)
  rowMenu.y = Math.min(event.clientY, window.innerHeight - 130)
  rowMenu.open = true
}

function closeRowMenu() {
  rowMenu.open = false
}

function openMenuLink(target) {
  if (!rowMenu.href) return
  if (target === '_self') {
    window.location.href = rowMenu.href
  } else {
    window.open(rowMenu.href, '_blank')
  }
  closeRowMenu()
}

async function copyMenuLink() {
  const url = new URL(rowMenu.href, window.location.origin).href
  try {
    await navigator.clipboard.writeText(url)
    dialog.showSuccess('已複製連結', url)
  } catch {
    dialog.showError('複製失敗', '瀏覽器不允許複製連結，請改用開啟新分頁。')
  } finally {
    closeRowMenu()
  }
}

function goToMemberDetail(guid) {
  const routeData = router.resolve({
    name: 'MembersDetail',
    params: { guid },
  })

  window.open(routeData.href, '_blank')
}

/* 結案切換 */
async function onToggleEndCase(id, nextValue) {
  console.log(id, nextValue)
  const prev = !nextValue

  dialog.showLoading()

  try {
    const { data } = await api.patch(`/Order/ToggleIsEndCase/${id}`, {
      isEndCase: nextValue,
    })
    console.log(data)
  } catch (err) {
    dialog.showAxiosError(err, '結案切換失敗')
    item.isEndCase = prev
  } finally {
    dialog.hideLoading()
  }
}

function onGlobalKeydown(event) {
  if (event.key === 'Escape') closeRowMenu()
}

onMounted(() => {
  window.addEventListener('click', closeRowMenu)
  window.addEventListener('scroll', closeRowMenu, true)
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeRowMenu)
  window.removeEventListener('scroll', closeRowMenu, true)
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style scoped>
.v-data-table :deep(table thead th) {
  white-space: nowrap !important;
}

.copy-cell {
  cursor: copy;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: inline-block;
}

.copy-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.text-mono {
  font-family: monospace;
}

.v-data-table :deep(table thead) {
  background-color: #f5f5f5;
  color: #333;
}

.row-link-menu {
  position: fixed;
  z-index: 2500;
  width: 180px;
  padding: 6px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.row-link-menu button {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: #222;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.row-link-menu button:hover {
  background: #f5f5f5;
}

.order-page-scrim {
  position: fixed;
  inset: 0 560px 0 0;
  z-index: 2300;
  background: rgba(0, 0, 0, 0.24);
  cursor: pointer;
  transition: inset 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.order-page-scrim.scrim-with-member {
  inset: 0 1200px 0 0;
}

.order-info-drawer {
  z-index: 2400;
}

.order-info-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding-top: 16px;
  background: rgb(var(--v-theme-surface));
}

.order-info-section :deep(.v-card-title) {
  padding-bottom: 4px;
}

.order-info-section :deep(th) {
  width: 150px;
  color: rgba(0, 0, 0, 0.72);
  font-weight: 700;
  vertical-align: top;
}

.order-info-section :deep(td) {
  word-break: break-word;
}

.copy-value-button {
  display: block;
  width: 100%;
  min-height: 28px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1.45;
  text-align: left;
  cursor: copy;
}

.copy-value-button:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.copy-value-button.copied {
  border-color: rgba(var(--v-theme-success), 0.45);
  background: rgba(var(--v-theme-success), 0.12);
}

.email-value-button {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}
</style>

<style>
/* ---- Teleport 到 body 的會員抽屜，需要非 scoped 樣式 ---- */
.member-info-drawer {
  position: fixed;
  top: 0;
  right: 560px;
  width: 640px;
  height: 100vh;
  background: rgb(var(--v-theme-surface, 255, 255, 255));
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  z-index: 2450;
}

.member-info-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding-top: 16px;
  background: rgb(var(--v-theme-surface));
}

/* 進場/離場動畫 */
.member-drawer-enter-active,
.member-drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.member-drawer-enter-from,
.member-drawer-leave-to {
  transform: translateX(100%);
}

/* 會員抽屜內的 section 卡片 */
.member-info-drawer .order-info-section .v-card-title {
  padding-bottom: 4px;
}

.member-info-drawer .order-info-section th {
  color: rgba(0, 0, 0, 0.72);
  font-weight: 700;
  vertical-align: top;
}

.member-info-drawer .order-info-section td {
  word-break: break-word;
}

/* 組織線上線/下線表格使用 table-layout:fixed 讓 inline width 生效 */
.member-info-drawer .order-info-section .v-table table {
  table-layout: fixed;
}

.member-info-drawer .copy-value-button {
  display: block;
  width: 100%;
  min-height: 28px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1.45;
  text-align: left;
  cursor: copy;
}

.member-info-drawer .copy-value-button:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.member-info-drawer .copy-value-button.copied {
  border-color: rgba(var(--v-theme-success), 0.45);
  background: rgba(var(--v-theme-success), 0.12);
}
</style>
