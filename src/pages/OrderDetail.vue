<template>
  <v-container class="pt-6 pl-6">
    <div class="d-flex align-center">
      <div class="d-flex">
        <v-btn class="mr-3" variant="flat" color="secondary" :to="{ name: 'Order' }">返回</v-btn>
        <h2 class="text-primary">訂單案件</h2>
      </div>
      <v-spacer></v-spacer>
      <div class="d-flex align-center">
        <v-btn
          v-if="
            authStore.hasPermission('ORDER_CASE_EDIT') &&
            !['CANCELLED', 'COMPLETED'].includes(order.orderStatus)
          "
          class="mr-3"
          variant="flat"
          color="primary"
          hide-details
          @click="reviewOrder"
        >
          審核
        </v-btn>
        <v-btn
          v-if="
            authStore.hasPermission('ORDER_CASE_EDIT') &&
            !['CANCELLED', 'COMPLETED'].includes(order.orderStatus)
          "
          class="mr-3"
          prepend-icon="close"
          variant="flat"
          color="secondary"
          @click="cancelOrder(props.id)"
          >取消訂單</v-btn
        >
        <!-- <v-btn
        v-if="authStore.hasPermission('ORDER_CASE_EDIT')"
        class="mr-3"
        prepend-icon="delete"
        variant="flat"
        color="secondary"
        >封存訂單</v-btn
      > -->
        <v-checkbox
          v-if="authStore.hasPermission('ORDER_CASE_EDIT')"
          v-model="order.isEndCase"
          @update:model-value="onToggleEndCase"
          class="mr-3"
          label="結案"
          hide-details
        ></v-checkbox>
      </div>
    </div>
  </v-container>
  <v-container class="main pa-10">
    <v-row>
      <!-- 左邊 -->
      <v-col cols="8">
        <div class="mb-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <p class="mr-2">訂單編號：{{ order?.orderNo ?? '00000000000' }}</p>
            <v-chip
              class="mr-3"
              variant="tonal"
              :color="formatPaymentStatusColor(order?.orderStatus)"
            >
              {{ formatPaymentStatusText(order?.orderStatus) }}
            </v-chip>
          </div>

          <span>訂單時間：{{ useDateFormat(order?.orderDate, 'YYYY/MM/DD HH:mm') }}</span>
        </div>

        <v-card variant="flat" class="mb-3">
          <v-card-title>訂單案件</v-card-title>
          <v-card-text>
            <v-card
              :to="{ name: 'ProductEdit', params: { id: salesOrderItem?.productId } }"
              variant="outlined"
              color="primary"
            >
              <v-card-text class="d-flex">
                <!-- <div>
                  <v-img
                    :width="100"
                    :aspect-ratio="1"
                    cover
                    src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
                  ></v-img>
                </div> -->
                <div>
                  <h3 class="mb-2">{{ salesOrderItem?.productName }}</h3>
                  <ul class="d-flex flex-column ml-7 text-black ga-2">
                    <li v-for="(item, index) in specTypeList" :key="index">
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </v-card-text>
            </v-card>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-text class="d-flex align-center">
            <span class="mr-3 text-medium-emphasis">金額</span>
            <span v-if="!isEditAmount" class="text-subtitle-2">{{ order?.totalAmount }}</span>
            <v-text-field
              v-else
              density="compact"
              v-model="order.totalAmount"
              class="text-subtitle-2"
              hide-details
            />
            <span class="mr-3">元</span>

            <div v-if="authStore.hasPermission('ORDER_CASE_EDIT')" class="d-flex">
              <v-btn
                v-if="!isEditAmount"
                variant="text"
                color="primary"
                prepend-icon="edit"
                @click="updateAmount"
                >編輯金額</v-btn
              >
              <div v-else>
                <v-btn variant="text" color="primary" prepend-icon="save" @click="saveAmount"
                  >儲存</v-btn
                >
                <v-btn variant="text" color="primary" prepend-icon="cancel" @click="cancelAmount"
                  >取消</v-btn
                >
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card v-if="authStore.hasPermission('ORDER_CASE_EDIT')" variant="flat" class="mb-3">
          <v-card-title>預設分佣模板</v-card-title>
          <v-card-text>
            <v-form validate-on="input" ref="consultantForm" @submit.prevent>
              <v-card class="mb-3" variant="flat" border>
                <v-card-title class="d-flex">
                  顧問師
                  <v-spacer></v-spacer>
                  <v-btn variant="flat" color="primary" type="submit" @click="saveConsultant">
                    儲存
                  </v-btn>
                </v-card-title>

                <v-card-text>
                  <div
                    v-for="(row, index) in consultantRows"
                    :key="row.rowKey"
                    class="d-flex ga-3 mb-3 align-center"
                  >
                    <v-autocomplete
                      v-model="row.consultantCategoryId"
                      :items="consultantCategories"
                      item-title="name"
                      item-value="id"
                      label="選擇顧問師類別"
                      hide-details="auto"
                      :rules="[rules.required]"
                      max-width="225"
                      @update:modelValue="(val) => onConsultantCategoryChange(row, val)"
                    />
                    <v-autocomplete
                      v-model="row.consultant"
                      :items="getConsultantsByCategory(row.consultantCategoryId)"
                      :loading="isConsultantsLoading(row.consultantCategoryId)"
                      item-title="name"
                      item-value="accountGuid"
                      label="選擇人員"
                      :rules="[rules.required]"
                      hide-details="auto"
                      :hint="isConsultantsLoading(row.consultantCategoryId) ? '載入中...' : ''"
                      max-width="225"
                      persistent-hint
                      :disabled="!row.consultantCategoryId"
                      :no-data-text="row.consultantCategoryId ? '沒有符合的人員' : '請先選擇類別'"
                      return-object
                    />

                    <v-text-field
                      v-model.number="row.percent"
                      type="number"
                      min="0"
                      max="100"
                      variant="underlined"
                      suffix="%"
                      :rules="[rules.required]"
                      hide-details="auto"
                    />

                    <v-checkbox v-model="row.enabled" color="primary" label="可發佣" hide-details />
                    <v-btn variant="plain" icon="delete" @click="removeConsultantRow(index)" />
                  </div>

                  <v-btn
                    variant="text"
                    prepend-icon="add"
                    color="primary"
                    @click="addConsultantRow"
                  >
                    新增人員
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-form>
            <v-form validate-on="input" ref="lecturerForm" @submit.prevent>
              <v-card class="mb-3" variant="flat" border>
                <v-card-title class="d-flex">
                  講師
                  <v-spacer></v-spacer>
                  <v-btn variant="flat" color="primary" type="submit" @click="saveLecturer">
                    儲存
                  </v-btn>
                </v-card-title>

                <v-card-text>
                  <div v-for="(row, index) in lecturerRows" class="d-flex ga-3 mb-3 align-center">
                    <v-autocomplete
                      v-model="row.lecturer"
                      v-model:search="row.search"
                      :items="row.options"
                      :loading="row.loading"
                      max-width="350"
                      item-title="email"
                      item-value="guid"
                      label="選擇人員"
                      hide-details="auto"
                      :custom-filter="() => true"
                      :rules="[rules.required]"
                      @update:search="debouncedSearchLecturer(row)"
                      return-object
                    >
                      <!-- ✅ 選取之後，輸入框裡顯示的 chip 樣式 -->
                      <template #chip="{ props, item }">
                        <div v-bind="props" class="d-flex align-center">
                          <span class="font-weight-medium mr-2">
                            {{ item.raw.name ?? '無名稱' }}
                          </span>
                          <span class="text-caption text-grey">
                            {{ item.raw.email }}
                          </span>
                        </div>
                      </template>
                      <!-- ✅ 下拉選單列表樣式 -->
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #title>
                            <span class="font-weight-medium">
                              {{ item.raw.name ?? '無名稱' }}
                            </span>
                          </template>

                          <template #subtitle>
                            <span class="text-caption text-grey">
                              {{ item.raw.email }}
                            </span>
                          </template>
                        </v-list-item>
                      </template>
                      <template #no-data>
                        <div class="text-center pa-4">
                          <div v-if="!row.search?.trim()">
                            <span>請輸入 Email 或姓名開始搜尋</span>
                          </div>

                          <div v-else-if="row.loading">
                            <span>搜尋中…</span>
                          </div>

                          <div v-else>
                            <span>查無「{{ row.search.trim() }}」的帳號</span>
                          </div>
                        </div>
                      </template>
                    </v-autocomplete>

                    <v-text-field
                      v-model.number="row.percent"
                      type="number"
                      min="0"
                      max="100"
                      variant="underlined"
                      :rules="[rules.required]"
                      suffix="%"
                      hide-details="auto"
                    />

                    <v-checkbox v-model="row.isPaid" color="primary" label="可發佣" hide-details />

                    <v-btn variant="plain" icon="delete" @click="removeLecturerRow(index)" />
                  </div>

                  <v-btn variant="text" prepend-icon="add" color="primary" @click="addLecturerRow">
                    新增人員
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card v-if="authStore.hasPermission('ORDER_CASE_EDIT')" variant="flat" class="mb-3">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>業務分潤表</span>
            <div class="d-flex align-center ga-2">
              <v-checkbox
                v-model="lockAll"
                color="primary"
                label="鎖定全部"
                hide-details
                :disabled="referrers.every((r) => r.persistedLocked)"
              />
              <v-btn
                color="primary"
                variant="flat"
                @click="saveMarketingCodes(salesOrderItem?.salesOrderItemId)"
                :disabled="referrers.every((r) => r.persistedLocked)"
                >儲存</v-btn
              >
            </div>
          </v-card-title>
          <v-card-text>
            <div v-for="row in referrers" :key="row.position" class="mb-4 d-flex ga-3">
              <div class="text-caption text-medium-emphasis" style="width: 48px">
                #{{ row.position }}
              </div>
              <v-autocomplete
                :disabled="row.persistedLocked"
                v-model="row.referrerAccount"
                v-model:search="row.search"
                placeholder="輸入姓名或 Email 搜尋"
                max-width="335"
                :items="row.options"
                :loading="row.loading"
                item-value="accountGuid"
                item-title="profiles.realName"
                hide-details="auto"
                clearable
                :custom-filter="() => true"
                @update:search="() => debouncedSearchSales(row)"
                @update:modelValue="(acc) => onPickReferrer(row, acc)"
                return-object
              >
                <!-- ✅ 選取之後，輸入框裡顯示的 chip 樣式 -->
                <template #chip="{ props, item }">
                  <div v-bind="props" class="d-flex align-center">
                    <span class="font-weight-medium mr-2">
                      {{ item.raw.profiles?.realName ?? '無名稱' }}
                    </span>
                    <span class="text-caption text-grey">
                      {{ item.raw.profiles?.email }}
                    </span>
                  </div>
                </template>

                <!-- ✅ 下拉選單列表樣式 -->
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #title>
                      <span class="font-weight-medium">
                        {{ item.raw.profiles?.realName ?? '無名稱' }}
                      </span>
                    </template>

                    <template #subtitle>
                      <span class="text-caption text-grey">
                        {{ item.raw.profiles?.email }}{{ '(' + item.raw.profiles?.idNumber + ')' }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <!-- ✅ 沒有資料/載入中顯示狀態 -->
                <template #no-data>
                  <div class="text-center pa-4">
                    <div v-if="!row.search?.trim()">
                      <div class="text-body-2">請輸入 Email 或姓名開始搜尋</div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        例如：amy / amy@email.com
                      </div>
                    </div>

                    <div v-else-if="row.loading">
                      <div class="text-body-2">搜尋中…</div>
                    </div>

                    <div v-else>
                      <img src="/images/NoSearch.svg" alt="no-data" style="max-width: 160px" />
                      <div class="text-body-2 mt-2">查無「{{ row.search.trim() }}」的帳號</div>
                    </div>
                  </div>
                </template>
              </v-autocomplete>
              <v-text-field
                v-model="row.referrerNameSnapshot"
                variant="underlined"
                :disabled="row.persistedLocked"
                hide-details="auto"
              ></v-text-field>
              <v-text-field
                v-model="row.allocValue"
                variant="underlined"
                suffix="%"
                :disabled="row.persistedLocked"
                hide-details="auto"
              ></v-text-field>
              <v-checkbox
                :disabled="row.persistedLocked"
                label="鎖定"
                v-model="row.isLocked"
                color="primary"
                hide-details="auto"
              ></v-checkbox>
            </div>
          </v-card-text>
        </v-card>
        <v-card variant="flat" class="mb-3">
          <v-card-title
            >付款紀錄
            <p class="text-caption">
              佣金依付款月份發放：每筆訂單可能包含多次付款，9 月付款金額於 9 月發放，10 月付款金額於
              10 月發放，依此類推。
            </p>
          </v-card-title>
          <v-card-text>
            <v-table hover>
              <thead style="background-color: #f5f5f5">
                <tr>
                  <td>付款時間</td>
                  <td>付款方式</td>
                  <td>金額</td>
                  <td>狀態</td>
                  <td>金流狀態</td>
                  <td>操作</td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in productOrderPayment" :key="payment.productOrderPaymentId">
                  <td>{{ useDateFormat(payment?.createdAt, 'YYYY/MM/DD HH:mm') }}</td>
                  <td>信用卡</td>
                  <td>{{ payment?.amount }}元</td>
                  <td>
                    <v-chip size="small" :color="formatPaymentStatusColor(payment?.status)">{{
                      formatPaymentStatusText(payment?.status)
                    }}</v-chip>
                  </td>
                  <td>{{ payment?.failureMessage }}</td>
                  <td><v-btn icon="edit" variant="plain"></v-btn></td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
        <v-card variant="flat" class="mb-3">
          <v-card-title>發票</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
                <tr>
                  <th class="text-no-wrap">發票類別</th>
                  <td>{{ order?.invoiceType }}</td>
                </tr>
                <tr v-if="order?.invoiceType == '三聯式（公司）'">
                  <th>公司抬頭</th>
                  <td>{{ order?.companyTitle ?? '-' }}</td>
                </tr>
                <tr v-if="order?.invoiceType == '三聯式（公司）'">
                  <th>公司統編</th>
                  <td>{{ order?.companyTaxId ?? '-' }}</td>
                </tr>
                <tr>
                  <th>發票地址</th>
                  <td>
                    {{
                      (order?.invoiceCity || '') +
                      (order?.invoiceDistrict || '') +
                      (order?.invoiceAddress || '')
                    }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- <v-card variant="flat" class="mb-3">
          <v-card-title>轉帳匯款</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
                <tr>
                  <th class="text-no-wrap">填寫日期</th>
                  <td>yyyy-mm-dd</td>
                </tr>
                <tr>
                  <th>轉帳銀行</th>
                  <td>玉山銀行</td>
                </tr>
                <tr>
                  <th>帳號末五碼</th>
                  <td>0000000000000</td>
                </tr>
                <tr>
                  <th>轉帳證明</th>
                  <td>
                    <v-img
                      :width="300"
                      aspect-ratio="16/9"
                      cover
                      src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
                    ></v-img>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card> -->

        <v-card variant="flat" class="mb-3">
          <v-card-title>表單</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
                <tr>
                  <th class="text-no-wrap">真實姓名</th>
                  <td>{{ order?.buyerName }}</td>
                </tr>
                <tr>
                  <th>性別</th>
                  <td>{{ order?.buyerGender }}</td>
                </tr>
                <tr>
                  <th>生日</th>
                  <td>{{ useDateFormat(order?.buyerBirthday, 'YYYY/MM/DD') }}</td>
                </tr>
                <tr>
                  <th>連絡電話</th>
                  <td>{{ order?.buyerPhone }}</td>
                </tr>
                <tr>
                  <th>電子信箱</th>
                  <td>{{ order?.buyerEmail }}</td>
                </tr>
                <tr>
                  <th>身分證</th>
                  <td>{{ order?.buyerIdNumber }}</td>
                </tr>
                <tr>
                  <th>地址</th>
                  <td>{{ order?.buyerCity + order?.buyerDistrict + order?.buyerAddress }}</td>
                </tr>
                <tr>
                  <th>公司名稱</th>
                  <td>{{ order?.buyerUnit }}</td>
                </tr>
                <tr>
                  <th>公司統編</th>
                  <td>{{ order?.buyerIdNumber }}</td>
                </tr>
                <tr>
                  <th>職稱</th>
                  <td>{{ order?.buyerTitle }}</td>
                </tr>
                <tr>
                  <th>證件</th>
                  <td>
                    <FileImage
                      v-if="order?.files?.[0]?.fileId"
                      :fileId="order?.files?.[0]?.fileId"
                    ></FileImage>
                  </td>
                </tr>
                <tr>
                  <th>備註</th>
                  <td>{{ order?.remark }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      <!-- 右邊 -->
      <v-col cols="4">
        <v-card variant="flat" class="mb-3">
          <v-card-title class="d-flex justify-space-between">
            會員資訊
            <v-btn variant="outlined" @click="openOrgTreeDialog">訂單組織圖</v-btn>
          </v-card-title>
          <v-card-text>
            <!-- :to="{ name: 'MembersDetail', params: { guid: order?.accountGuid } }" -->
            <v-card
              v-if="order?.accountGuid"
              variant="outlined"
              color="primary"
              :to="{ name: 'MembersDetail', params: { guid: order?.accountGuid } }"
            >
              <v-card-text>
                {{ member?.name }}
                {{ member?.email }}
              </v-card-text>
            </v-card>
            <v-card v-else variant="outlined">
              <v-card-text class="text-medium-emphasis"> 無對應會員資料 </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <v-card v-if="authStore.hasPermission('ORDER_CASE_EDIT')" variant="flat" class="mb-3">
          <v-card-title class="d-flex">
            合約書編號
            <v-spacer></v-spacer>
            <v-btn size="small" variant="flat" color="primary" @click="saveContractNumber"
              >儲存</v-btn
            >
          </v-card-title>
          <v-card-text>
            <v-text-field v-model="order.contractNumber" label="編號" hide-details></v-text-field>
          </v-card-text>
        </v-card>
        <v-card variant="flat" class="mb-3">
          <v-card-title class="d-flex">
            備註
            <v-spacer></v-spacer>
            <v-btn size="small" variant="flat" color="primary" @click="saveAdminRemark">儲存</v-btn>
          </v-card-title>
          <v-card-text>
            <v-textarea v-model="order.adminRemark" label="備註" hide-details></v-textarea>
          </v-card-text>
        </v-card>
        <!-- <v-card variant="flat" class="mb-3">
          <v-card-title>訂單記錄</v-card-title>
          <v-card-text class="d-flex flex-column ga-3">
            <p v-for="item in 3">2025/09/26 已付款</p>
          </v-card-text>
        </v-card> -->
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="orgTreeDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6"> 訂單分潤上線 </v-card-title>

      <v-card-text>
        <div class="upline-container">
          <div v-for="(item, index) in upline" :key="item.accountGuid" class="upline-item">
            <!-- 卡片 -->
            <v-card
              variant=" outlined"
              color="primary"
              class="pa-3 text-center"
              elevation="2"
              :to="{ name: 'AgentDetail', params: { id: item.accountGuid } }"
            >
              <div class="font-weight-bold">
                {{ item.realName }}
              </div>
              <div class="text-caption">
                {{ item.email }}
              </div>
              <div class="text-caption text-grey">
                {{ item.template?.name }}
              </div>
            </v-card>

            <!-- 箭頭 -->
            <v-icon v-if="index !== upline.length - 1" class="my-2" color="grey">
              arrow_downward_alt
            </v-icon>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="orgTreeDialog = false">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useDateFormat } from '@/utils/formatDate'
import FileImage from '@/components/FileImageComponent.vue'
import { useProductRules } from '@/utils/rules'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  id: Number,
})

/* ------ 身分認證 ----------- */
const authStore = useAuthStore()

const rules = useProductRules()
const dialog = useDialogStore()

const order = ref({}) // 第一層
const salesOrderItem = computed(() => order.value?.salesOrderItems ?? [])
const productOrderPayment = computed(() => order.value?.productOrderPayments ?? [])
const revenueShare = computed(() => salesOrderItem.value?.revenueShares ?? null)

const member = ref()

const consultantForm = ref(null)
const consultantCategories = ref([]) //顧問師類別
const consultantRows = ref([]) // 顧問師列表
const consultantMap = ref(new Map()) // key: categoryId, value: 人員陣列
const consultantLoadingMap = ref(new Map()) // key: categoryId, value: boolean

const lecturerForm = ref(null)
const lecturerRows = ref([]) // 講師列表

const specTypeList = computed(() => {
  const specSummary = salesOrderItem.value?.specSummary
  if (!specSummary) return [] // 沒資料就回傳空陣列
  return specSummary.split('｜').map((s) => s.trim()) // 去掉前後空白
})

const orgTreeDialog = ref(false)
const upline = ref([])

/* 付款狀態-顏色文字變更 */
function formatPaymentStatusText(status) {
  const map = {
    CREATED: '已建立',
    UNPAID: '未付款',
    PAID: '已付款',
    FAILED: '付款失敗',
    REFUNDING: '退款處理中',
    REFUNDED: '已退款',
    CANCELLED: '已取消',
    COMPLETED: '已審核',
  }
  return map[status] || status || '-'
}

function formatPaymentStatusColor(status) {
  const map = {
    CREATED: 'info',
    UNPAID: 'warning',
    PAID: 'success',
    FAILED: 'error',
    REFUNDING: 'error',
    REFUNDED: 'info',
    CANCELLED: 'gray_300',
    COMPLETED: 'success',
  }
  return map[status] || status || '-'
}

/* 結案切換 */
async function onToggleEndCase(nextValue) {
  const prev = !order.value.isEndCase
  order.value.isEndCase = nextValue

  dialog.showLoading()

  try {
    const { data } = await api.patch(`/Order/ToggleIsEndCase/${props.id}`, {
      isEndCase: nextValue,
    })
  } catch (err) {
    dialog.showAxiosError(err, '結案切換失敗')
    order.value.isEndCase = prev
  } finally {
    dialog.hideLoading()
  }
}

/* 編輯金額 */
const isEditAmount = ref(false)
function updateAmount() {
  isEditAmount.value = !isEditAmount.value
}

function cancelAmount() {
  isEditAmount.value = false
}

async function saveAmount() {
  dialog.showLoading()
  try {
    const { data } = await api.patch(`/Order/UpdateAmount/${props.id}`, {
      amount: order.value?.totalAmount,
    })
    isEditAmount.value = false
  } catch (error) {
    dialog.showAxiosError(error, '金額更新失敗')
  } finally {
    dialog.hideLoading()
  }
}

/* 新增刪除儲存顧問師 */
function mapDbConsultantsToRows(dbRows) {
  return (dbRows ?? []).map((r) => ({
    rowKey: `db-${r.id}`, // ✅ 穩定 key
    // 之後要更新/刪除用得到
    salesOrderConsultantId: r.id,

    consultantCategoryId: r.consultantCategoryId,

    // 讓你的 v-autocomplete（return-object）能顯示已選取的人
    consultant: {
      id: r.consultantId,
      consultantCategoryId: r.consultantCategoryId,
      accountGuid: r.accountGuid,
      name: r.name,
      email: r.email,
    },

    // 你畫面用 percent 欄位
    percent: r.consultantValue,

    // ⚠️ 你 UI 是「可發佣」，DB 是 isPaid（已發）
    // 先暫時塞進 enabled 讓 checkbox 顯示（但語意不完全正確）
    enabled: r.isPaid,
  }))
}

function addConsultantRow() {
  consultantRows.value.push({
    rowKey: `tmp-${crypto.randomUUID()}`, // ✅ 新增列也要穩定 key
    consultantCategoryId: null,
    consultant: null,
    percent: revenueShare.value?.consultantValue ?? null,
    enabled: false,
  })
  nextTick(() => consultantForm.value?.validate())
}

function removeConsultantRow(index) {
  consultantRows.value.splice(index, 1)
  nextTick(() => consultantForm.value?.validate())
}

async function saveConsultant() {
  const { valid } = await consultantForm.value?.validate()

  if (!valid) {
    dialog.showError('驗證失敗', '紅框欄位未輸入')
    return
  }

  const payload = buildConsultantPayload(props.id)
  dialog.showLoading()
  try {
    // 假設 order 裡有 id
    const { data } = await api.put(`/Order/Consultant/${props.id}`, payload)
    await fetchOrder(props.id)
  } catch (err) {
    dialog.showAxiosError(err, '顧問師分佣儲存失敗')
  } finally {
    dialog.hideLoading()
  }
}

function buildConsultantPayload(salesOrderId) {
  return (
    consultantRows.value
      // 避免送空列（你有 required rules，但保險）
      .filter((r) => r.consultantCategoryId && r.consultant && r.percent != null)
      .map((r) => ({
        salesOrderConsultantId: r.salesOrderConsultantId ?? null, // 若之後要做更新會用到
        salesOrderId, // ✅ 建議一起送（不然後端要自己推是哪張訂單）
        consultantCategoryId: r.consultantCategoryId,
        consultantId: r.consultant.id,
        accountGuid: r.consultant.accountGuid,
        name: r.consultant.name,
        email: r.consultant.email,
        consultantType: 'PERCENT',
        consultantValue: Number(r.percent),
        isPaid: !!r.enabled, // ⚠️ 你 enabled 現在語意是「可發佣」，不一定等於已發/已付
      }))
  )
}

/* 新增刪除儲存講師 */
function mapDbLecturersToRows(dbRows) {
  return (dbRows ?? []).map((r) => ({
    // 之後要更新/刪除用得到
    salesOrderLecturerId: r.id,

    // 讓你的 v-autocomplete（return-object）能顯示已選取的人
    lecturer: {
      guid: r.accountGuid,
      name: r.name,
      email: r.email,
    },

    percent: r.lecturerValue ?? null,
    isPaid: !!r.isPaid,

    options: [],
    loading: false,
    search: '',
    searchTimer: null,
  }))
}

function debouncedSearchLecturer(row) {
  clearTimeout(row.searchTimer)
  row.searchTimer = setTimeout(() => {
    searchAccount(row)
  }, 300)
}

async function searchAccount(row) {
  const search = (row.search ?? '').trim()

  if (!search) {
    row.options = []
    row.loading = false
    return
  }

  row.loading = true

  try {
    const { data } = await api.get(`/Account/Filter`, {
      params: { search },
    })
    row.options = data
  } catch (error) {
  } finally {
    row.loading = false
  }
}

function addLecturerRow() {
  lecturerRows.value.push({
    salesOrderLecturerId: null,
    options: [],
    loading: false,
    lecturer: null,
    percent: revenueShare.value?.lecturerValue ?? null,
    isPaid: false,
    search: '',
    searchTimer: null,
  })

  nextTick(() => lecturerForm.value?.validate())
}

function removeLecturerRow(index) {
  lecturerRows.value.splice(index, 1)
  nextTick(() => lecturerForm.value?.validate())
}

function buildLecturer() {
  return lecturerRows.value.map((r) => ({
    salesOrderLecturerId: r.salesOrderLecturerId ?? null,
    accountGuid: r.lecturer?.guid ?? null,
    name: r.lecturer?.name ?? '',
    email: r.lecturer?.email ?? '',
    lecturerValue: r.percent ?? 0,
    isPaid: !!r.isPaid,
  }))
}

async function saveLecturer() {
  const { valid } = await lecturerForm.value?.validate()

  if (!valid) {
    dialog.showError('驗證失敗', '紅框欄位未輸入')
    return
  }

  const payload = buildLecturer()
  dialog.showLoading()
  try {
    const { data } = await api.put(`/Order/Lecturer/${props.id}`, payload)
    await fetchOrder(props.id)
  } catch (err) {
    dialog.showAxiosError(err, '講師儲存失敗')
  } finally {
    dialog.hideLoading()
  }
}

/* 行銷代碼 */
const makeReferrerRow = (pos) => ({
  // 後端欄位
  referrerAccountGuid: null,
  referrerEmailSnapshot: null,
  referrerNameSnapshot: null,
  allocType: 'PERCENT',
  allocValue: null,
  allocNote: null,
  isLocked: false,
  position: pos,

  // ✅ 新增：後端「已儲存」的鎖定狀態（用來控制能不能編輯）
  persistedLocked: false,

  // 前端 UI 用
  referrerAccount: null,
  search: '',
  options: [],
  loading: false,
})

const referrers = ref([])
// const referrers = ref(Array({ length: 4 }, (_, i) => makeReferrerRow(i + 1)))

function marketingCodeMap(serverRows) {
  const rows = Array.from({ length: 4 }, (_, i) => makeReferrerRow(i + 1))

  for (const r of serverRows) {
    const idx = (r.position ?? 0) - 1
    if (idx < 0 || idx > 3) continue
    rows[idx] = {
      ...rows[idx],
      ...r,
      // ✅ 後端鎖定：只讀用
      persistedLocked: !!r.isLocked,

      referrerAccount: r.referrerAccountGuid
        ? {
            accountGuid: r.referrerAccountGuid,
            profiles: {
              realName: r.referrerNameSnapshot,
              email: r.referrerEmailSnapshot,
            },
          }
        : null,
    } // 直接覆蓋後端欄位
  }

  referrers.value = rows
}

// 搜尋會員帳號
const searchTimers = new Map()
function debouncedSearchSales(row) {
  // 清掉上一個 timer（同一列）
  const old = searchTimers.get(row.position)
  if (old) clearTimeout(old)

  const t = setTimeout(() => {
    searchAgents(row)
  }, 400)

  searchTimers.set(row.position, t)
}

async function searchAgents(row) {
  const search = (row.search ?? '').trim()

  row.loading = true
  try {
    const { data } = await api.get(`/PayGradeContract/FilterPayGradeProfile`, {
      params: { search },
    })

    row.options = data
  } finally {
    row.loading = false
  }
}

function onPickReferrer(row, acc) {
  if (!acc) {
    row.referrerAccountGuid = null
    row.referrerEmailSnapshot = null
    row.referrerNameSnapshot = null
    return
  }
  row.referrerAccountGuid = acc.accountGuid
  row.referrerEmailSnapshot = acc.profiles?.email
  row.referrerNameSnapshot = acc.profiles?.realName ?? ''
}

function buildMarketingCodePayload() {
  return referrers.value.map((r) => ({
    salesOrderItemMarketingCodeId: r.salesOrderItemMarketingCodeId,
    salesOrderItemId: r.salesOrderItemId,
    // marketingCode: r.marketingCode,
    referrerAccountGuid: r.referrerAccountGuid,
    referrerEmailSnapshot: r.referrerEmailSnapshot,
    referrerNameSnapshot: r.referrerNameSnapshot,
    position: r.position,
    allocValue: Number(r.allocValue ?? null),
    adminEditedBy: r.adminEditedBy,
    adminEditedAt: r.adminEditedAt,
    isLocked: r.isLocked,
    lockedAt: r.lockedAt,
  }))
}
const lockAll = computed({
  get() {
    const editableRows = referrers.value.filter((r) => !r.persistedLocked)
    if (editableRows.length === 0) return false
    return editableRows.every((r) => r.isLocked)
  },
  set(val) {
    referrers.value = referrers.value.map((r) => {
      // 已儲存鎖定的列：不要被「鎖定全部」影響
      if (r.persistedLocked) return r
      return { ...r, isLocked: val }
    })
  },
})

// const marketingCodeRows = ref([])

// watch(
//   () => order.value?.salesOrderItems?.[0]?.salesOrderItemMarketingCodes,
//   (codes) => {
//     const cloned = JSON.parse(JSON.stringify(codes ?? []))
//     marketingCodeRows.value = cloned.map((c) => ({
//       ...c,
//       search: '',
//       options: [],
//       loading: false,
//     }))
//   },
//   { immediate: true },
// )

/* 抓取資料 */
async function fetchOrder(id) {
  dialog.showLoading()
  try {
    const { data } = await api.get(`/Order/${id}`)
    order.value = data
    consultantRows.value = mapDbConsultantsToRows(data.consultants ?? [])
    await initConsultantOptionsForExistingRows()
    lecturerRows.value = mapDbLecturersToRows(data.lecturers ?? [])

    const marketingCode = data?.salesOrderItems?.marketingCodes ?? []

    if (Array.isArray(marketingCode) && marketingCode.length > 0) {
      marketingCodeMap(marketingCode)
    }

    if (data.accountGuid) {
      fetchAccount(data.accountGuid)
    }
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  } finally {
    dialog.hideLoading()
  }
}

async function fetchAccount(guid) {
  try {
    const { data } = await api.get(`/Account/Get/${guid}`)
    member.value = data
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  }
}

async function fetchConsultantCategory() {
  try {
    const { data } = await api.get(`/ConsultantCategory`)
    consultantCategories.value = data
  } catch (err) {
    dialog.showAxiosError(err, '資料抓取失敗')
  }
}

// 顧問師初次載入抓取類別選單人員
async function initConsultantOptionsForExistingRows() {
  const categoryIds = [
    ...new Set(consultantRows.value.map((r) => r.consultantCategoryId).filter(Boolean)),
  ]
  await Promise.all(categoryIds.map((id) => fetchConsultantsByCategory(id)))
}

async function fetchConsultantsByCategory(categoryId) {
  if (!categoryId) return []

  // 已經抓過就直接回傳
  const cached = consultantMap.value.get(categoryId)
  if (cached) return cached

  // 避免同類別同時重複呼叫
  if (consultantLoadingMap.value.get(categoryId)) return []
  consultantLoadingMap.value.set(categoryId, true)

  try {
    const { data } = await api.get(`/Consultant/GetByCategoryId/${categoryId}`)
    consultantMap.value.set(categoryId, data)
    return data
  } catch (err) {
    dialog.showAxiosError(err, '顧問師人員抓取失敗')
    return []
  } finally {
    consultantLoadingMap.value.set(categoryId, false)
  }
}

//儲存行銷代碼
async function saveMarketingCodes(id) {
  dialog.showLoading()
  const payload = buildMarketingCodePayload()
  try {
    const { data } = await api.put(`/Order/UpdateMarketCode/${id}`, payload)
    await fetchOrder(props.id)
  } catch (error) {
    dialog.showAxiosError(error, '業務分潤表更新失敗')
  } finally {
    dialog.hideLoading()
  }
}

// 顧問師類別變更後，清掉已選的人員，避免不一致
const onConsultantCategoryChange = async (row, newVal) => {
  if (row._lastCategoryId === undefined) {
    // 第一次初始化：只記錄，不清掉 consultant
    row._lastCategoryId = newVal
    await fetchConsultantsByCategory(newVal)
    return
  }

  // 真正有變更才清掉 consultant
  if (row._lastCategoryId !== newVal) {
    row._lastCategoryId = newVal
    row.consultant = null
    await fetchConsultantsByCategory(newVal)
    await nextTick()
    consultantForm.value?.validate()
  }
  nextTick(() => consultantForm.value?.validate())
}

//取得那列的顧問師名單
const getConsultantsByCategory = (categoryId) => {
  if (!categoryId) return []
  return consultantMap.value.get(categoryId) ?? []
}

const isConsultantsLoading = (categoryId) => {
  if (!categoryId) return false
  return consultantLoadingMap.value.get(categoryId) ?? false
}

/* 取消案件 */
async function cancelOrder(id) {
  const ok = await dialog.askConfirm({
    title: '確認取消案件',
    message: '訂單取消後不能復原',
    isDelete: true,
  })

  if (!ok) return

  dialog.showLoading()
  try {
    const { data } = await api.patch(`/Order/Cancel/${id}`)
    await fetchOrder(props.id)
  } catch (error) {
    dialog.showAxiosError(error, '取消失敗')
  } finally {
    dialog.hideLoading()
  }
}

/* 更新合約編號 */
async function saveContractNumber() {
  const number = order.value?.contractNumber ?? ''
  dialog.showLoading()
  try {
    const { data } = await api.patch(`/Order/UpdateContractNumber/${props.id}`, {
      contractNumber: number,
    })
    await fetchOrder(props.id)
  } catch (error) {
    dialog.showAxiosError(error, '合約編號更新失敗')
  } finally {
    dialog.hideLoading()
  }
}

/* 更新備註 */
async function saveAdminRemark() {
  const remark = order.value?.adminRemark ?? ''
  dialog.showLoading()
  try {
    const { data } = await api.patch(`/Order/UpdateAdminRemark/${props.id}`, {
      adminRemark: remark,
    })
    await fetchOrder(props.id)
  } catch (error) {
    dialog.showAxiosError(error, '備註更新失敗')
  } finally {
    dialog.hideLoading()
  }
}

/* 審查訂單 */
async function reviewOrder() {
  const ok = await dialog.askConfirm({
    title: '確認審核?',
    message: '訂單審核後不能更改',
    isDelete: false,
  })

  if (!ok) return

  dialog.showLoading()
  try {
    const { data } = await api.patch(`/Order/Reviewed/${props.id}`)
    await fetchOrder(props.id)
  } catch (error) {
    dialog.showAxiosError(error, '訂單審核失敗')
  } finally {
    dialog.hideLoading()
  }
}

async function fetchUpline() {
  try {
    dialog.showLoading()
    const { data } = await api.get(`/OrgTree/GetUpline/${order.value.accountGuid}`)
    upline.value = data.reverse()
    console.log('upline', data)
  } catch (error) {
    dialog.showAxiosError(error, '組織圖資料抓取失敗')
  } finally {
    dialog.hideLoading()
  }
}

/* 打開組織圖對話框 */
function openOrgTreeDialog() {
  orgTreeDialog.value = true
  fetchUpline()
}

onMounted(async () => {
  await Promise.all([fetchOrder(props.id), fetchConsultantCategory()])
})
</script>

<style scoped>
.main {
  min-height: 100vh;
  background: rgb(var(--v-theme-secondary));
}

.upline-item {
  display: flex;
  flex-direction: column;
  align-items: center; /* ⭐ 關鍵：水平置中 */
}

.upline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
