<template>
  <div>
    <div class="order-detail-header">
      <v-container class="py-3 pl-6">
        <div class="d-flex align-center">
          <div class="d-flex">
            <v-btn class="mr-3" variant="flat" color="secondary" @click="goBack">返回</v-btn>
            <h2 class="text-primary">訂單資料</h2>
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
            <v-btn
              v-if="
                authStore.hasPermission('ORDER_CASE_EDIT') &&
                order.paymentStatus === 'PAID' &&
                order.paymentMethodId === 1
              "
              class="mr-3"
              prepend-icon="currency_exchange"
              variant="flat"
              color="error"
              @click="refundOrder(props.id)"
              >退款/取消授權</v-btn
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
    </div>
    <div class="order-detail-body">
      <v-container class="main pa-10">
        <v-row>
          <!-- 左邊 -->
          <v-col cols="8">
            <div class="mb-3 d-flex align-center justify-space-between flex-wrap ga-2">
              <div class="d-flex align-center flex-wrap ga-2">
                <p class="mr-2 mb-0">訂單編號：{{ order?.orderNo ?? '00000000000' }}</p>
                <v-chip variant="tonal" :color="formatPaymentStatusColor(order?.orderStatus)">
                  {{ formatPaymentStatusText(order?.orderStatus) }}
                </v-chip>
                <v-chip variant="flat" color="secondary" size="small">
                  金流類型：{{ order?.paymentMethodName || '載入中...' }}
                </v-chip>
                <v-chip
                  v-if="order?.paymentStatus === 'PAID'"
                  variant="flat"
                  :color="order?.paymentMethodId === 1 ? 'success' : 'warning'"
                  size="small"
                >
                  {{
                    order?.paymentMethodId === 1
                      ? '可線上退款'
                      : '不支援線上退款 (' + getNonRefundableReason(order?.paymentMethodId) + ')'
                  }}
                </v-chip>
                <v-chip
                  v-else-if="order?.paymentStatus === 'REFUNDED'"
                  variant="flat"
                  color="info"
                  size="small"
                >
                  已退款
                </v-chip>
                <v-chip v-else variant="flat" color="grey" size="small"> 未付款 (無法退款) </v-chip>
              </div>

              <span>訂單時間：{{ useDateFormat(order?.orderDate, 'YYYY/MM/DD HH:mm') }}</span>
            </div>

            <v-card variant="flat" class="mb-3">
              <v-card-title class="d-flex align-center py-4 order-data-header">
                <span>訂單資料</span>
                <v-chip
                  class="ml-2"
                  size="small"
                  variant="tonal"
                  :color="productCompareStatusColor"
                >
                  {{ productCompareStatusText }}
                </v-chip>
                <v-spacer />
              </v-card-title>
              <v-card-text>
                <v-row dense class="order-product-compare-row">
                  <v-col
                    cols="12"
                    md="6"
                    class="order-snapshot-product-col"
                    :class="{ 'is-current-collapsed': !productCompareExpanded }"
                  >
                    <v-card variant="outlined" class="h-100">
                      <v-card-title class="text-subtitle-1">下單商品資料</v-card-title>
                      <v-card-text>
                        <h3 class="mb-2">
                          <span
                            v-for="(seg, sIdx) in snapshotProductNameDiff"
                            :key="sIdx"
                            :class="{ 'spec-diff-highlight': seg.changed }"
                            >{{ seg.text }}</span
                          >
                        </h3>
                        <div class="d-flex flex-wrap ga-2 mb-3">
                          <v-chip size="small" variant="tonal"
                            >商品ID：{{ salesOrderItem?.productId ?? '-' }}</v-chip
                          >
                          <v-chip size="small" variant="tonal"
                            >規格ID：{{ salesOrderItem?.variantId ?? '-' }}</v-chip
                          >
                          <v-chip size="small" variant="tonal"
                            >SKU：{{ salesOrderItem?.sku || '-' }}</v-chip
                          >
                        </div>
                        <ul
                          v-if="specTypeList.length"
                          class="d-flex flex-column ml-7 text-black ga-2"
                        >
                          <li v-for="(segments, index) in snapshotSpecDiff" :key="index">
                            <span
                              v-for="(seg, sIdx) in segments"
                              :key="sIdx"
                              :class="{ 'spec-diff-highlight': seg.changed }"
                              >{{ seg.text }}</span
                            >
                          </li>
                        </ul>
                        <p v-else class="text-medium-emphasis mb-0">無規格資料</p>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col
                    cols="12"
                    :md="productCompareExpanded ? 6 : 1"
                    class="order-current-product-col"
                    :class="{ 'is-collapsed': !productCompareExpanded }"
                  >
                    <v-card
                      class="h-100 current-product-compare-shell"
                      :class="[
                        `is-${productCompareStatusColor}`,
                        { 'is-expanded': productCompareExpanded },
                      ]"
                      variant="outlined"
                    >
                      <div
                        v-if="productCompareExpanded"
                        class="order-current-product-content"
                        :class="{ 'is-clickable': currentProductRoute }"
                        :role="currentProductRoute ? 'link' : undefined"
                        :tabindex="currentProductRoute ? 0 : -1"
                        @click="openCurrentProduct"
                        @keyup.enter="openCurrentProduct"
                      >
                        <v-card-title
                          class="text-subtitle-1 d-flex align-center"
                          :class="productCompareAccentTextClass"
                        >
                          目前商品資料
                          <v-spacer />
                          <v-chip
                            v-if="currentProductStatus?.message"
                            size="small"
                            variant="tonal"
                            :color="getCurrentProductStatusColor(currentProductStatus.code)"
                          >
                            {{ currentProductStatus.message }}
                          </v-chip>
                        </v-card-title>
                        <v-card-text>
                          <h3 class="mb-2">
                            <span
                              v-for="(seg, sIdx) in currentProductNameDiff"
                              :key="sIdx"
                              :class="{ 'spec-diff-highlight': seg.changed }"
                              >{{ seg.text }}</span
                            >
                          </h3>
                          <div class="d-flex flex-wrap ga-2 mb-3">
                            <v-chip
                              size="small"
                              variant="tonal"
                              :color="getCurrentProductFieldColor('productId')"
                            >
                              商品ID：{{ currentProductStatus?.currentProductId ?? '-' }}
                            </v-chip>
                            <v-chip
                              size="small"
                              variant="tonal"
                              :color="getCurrentProductFieldColor('variantId')"
                            >
                              規格ID：{{ currentProductStatus?.currentVariantId ?? '-' }}
                            </v-chip>
                            <v-chip
                              size="small"
                              variant="tonal"
                              :color="getCurrentProductFieldColor('sku')"
                            >
                              SKU：{{ currentProductStatus?.currentSku || '-' }}
                            </v-chip>
                          </div>
                          <ul
                            v-if="currentSpecTypeList.length"
                            class="d-flex flex-column ml-7 text-black ga-2"
                          >
                            <li v-for="(segments, index) in currentSpecDiff" :key="index">
                              <span
                                v-for="(seg, sIdx) in segments"
                                :key="sIdx"
                                :class="{ 'spec-diff-highlight': seg.changed }"
                                >{{ seg.text }}</span
                              >
                            </li>
                          </ul>
                          <p v-else class="text-medium-emphasis mb-0">無規格資料</p>
                        </v-card-text>
                      </div>
                      <div
                        class="current-product-toggle-rail"
                        role="button"
                        tabindex="0"
                        @click.stop.prevent="toggleProductCompare"
                        @keyup.enter.stop.prevent="toggleProductCompare"
                        @keyup.space.stop.prevent="toggleProductCompare"
                      >
                        <v-icon :color="productCompareStatusColor">
                          {{ productCompareExpanded ? 'chevron_right' : 'chevron_left' }}
                        </v-icon>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
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
                    <v-btn
                      variant="text"
                      color="primary"
                      prepend-icon="cancel"
                      @click="cancelAmount"
                      >取消</v-btn
                    >
                  </div>
                </div>
              </v-card-text>
            </v-card>
            <v-card v-if="hasSubscription" variant="flat" class="mb-3">
              <v-card-title class="d-flex align-center py-4">
                訂閱資訊
                <v-spacer />
                <v-chip
                  size="small"
                  variant="tonal"
                  :color="formatSubscriptionStatus(primarySubscription?.status).color"
                >
                  {{ formatSubscriptionStatus(primarySubscription?.status).text }}
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-card
                  variant="outlined"
                  class="subscription-summary-card"
                  role="button"
                  tabindex="0"
                  @click="openSubscriptionDrawer(primarySubscription)"
                  @keyup.enter="openSubscriptionDrawer(primarySubscription)"
                >
                  <div class="subscription-summary-grid">
                    <div>
                      <div class="text-caption text-medium-emphasis">委託單號</div>
                      <div class="font-weight-medium">
                        {{ primarySubscription?.periodNo || '-' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis">訂閱週期</div>
                      <div class="font-weight-medium">
                        {{ formatPeriodLabel(primarySubscription) }}
                      </div>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis">總期數</div>
                      <div class="font-weight-medium">
                        {{ primarySubscription?.periodTimes ?? '-' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis">已付款期數</div>
                      <div class="font-weight-medium">
                        {{ paidSubscriptionChargeCount }} / {{ totalSubscriptionPeriodCount }}
                      </div>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis">起始日</div>
                      <div class="font-weight-medium">
                        {{ formatDateTime(primarySubscription?.startedAt, 'YYYY/MM/DD') }}
                      </div>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis">下次扣款日</div>
                      <div class="font-weight-medium">
                        {{ formatDateTime(primarySubscription?.nextChargeDate, 'YYYY/MM/DD') }}
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-card-text>
            </v-card>

            <v-card variant="flat" class="mb-3">
              <v-card-title class="d-flex align-center py-4 revenue-compare-header">
                <span>分潤模板比對</span>
                <v-chip
                  class="mx-2"
                  size="small"
                  variant="tonal"
                  :color="hasRevenueShareDiff ? 'warning' : 'success'"
                >
                  {{ revenueCompareStatusText }}
                </v-chip>
                <v-btn
                  class="mr-2"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  :icon="revenueCompareExpanded ? 'expand_less' : 'expand_more'"
                  @click="toggleRevenueCompare"
                />
                <v-spacer />
                <v-chip
                  v-if="revenueShare?.snapshotAt"
                  size="small"
                  variant="tonal"
                  color="primary"
                >
                  下單快照：{{ useDateFormat(revenueShare.snapshotAt, 'YYYY/MM/DD HH:mm') }}
                </v-chip>
                <v-btn
                  v-if="authStore.hasPermission('ORDER_CASE_EDIT')"
                  class="ml-2"
                  variant="flat"
                  color="primary"
                  :loading="savingRevenueShare"
                  @click.stop="saveRevenueShareSnapshot"
                >
                  更新下單紀錄
                </v-btn>
              </v-card-title>
              <v-expand-transition>
                <v-card-text v-show="revenueCompareExpanded">
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined" class="h-100">
                        <v-card-title class="text-subtitle-1">下單分潤紀錄</v-card-title>
                        <v-table density="compact">
                          <tbody>
                            <tr
                              v-for="row in revenueCompareRows"
                              :key="row.key"
                              :class="{ 'revenue-diff-row': isRevenueShareRowDifferent(row) }"
                            >
                              <th class="text-no-wrap revenue-compare-cell">{{ row.label }}</th>
                              <td class="revenue-compare-cell">
                                <div class="revenue-edit-row">
                                  <template v-for="field in row.fields" :key="field.key">
                                    <v-switch
                                      v-if="field.kind === 'bool'"
                                      v-model="revenueShareDraft[field.key]"
                                      color="primary"
                                      density="compact"
                                      hide-details
                                    />
                                    <v-text-field
                                      v-else-if="field.kind === 'number'"
                                      v-model.number="revenueShareDraft[field.key]"
                                      type="number"
                                      density="compact"
                                      variant="underlined"
                                      hide-details
                                      :suffix="getRevenueFieldSuffix(revenueShareDraft, field)"
                                    />
                                    <v-select
                                      v-else-if="field.kind === 'type'"
                                      v-model="revenueShareDraft[field.key]"
                                      :items="shareTypeOptions"
                                      density="compact"
                                      variant="underlined"
                                      hide-details
                                    />
                                    <v-text-field
                                      v-else
                                      v-model="revenueShareDraft[field.key]"
                                      density="compact"
                                      variant="underlined"
                                      hide-details
                                    />
                                  </template>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-card variant="outlined" class="h-100" color="primary">
                        <v-card-title class="text-subtitle-1 d-flex align-center text-primary">
                          商品目前套用模板
                          <v-spacer />
                          <v-chip
                            v-if="currentProductStatus?.message"
                            size="small"
                            variant="tonal"
                            :color="getCurrentProductStatusColor(currentProductStatus.code)"
                          >
                            {{ currentProductStatus.message }}
                          </v-chip>
                        </v-card-title>
                        <v-table density="compact">
                          <tbody>
                            <tr
                              v-for="row in revenueCompareRows"
                              :key="row.key"
                              :class="{ 'revenue-diff-row': isRevenueShareRowDifferent(row) }"
                            >
                              <th class="text-no-wrap revenue-compare-cell">{{ row.label }}</th>
                              <td class="revenue-compare-cell">
                                {{ formatRevenueRowValue(currentRevenueShareScheme, row) }}
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-expand-transition>
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
                          :no-data-text="
                            row.consultantCategoryId ? '沒有符合的人員' : '請先選擇類別'
                          "
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

                        <v-checkbox
                          v-model="row.enabled"
                          color="primary"
                          label="可發佣"
                          hide-details
                        />
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
                      <div
                        v-for="(row, index) in lecturerRows"
                        class="d-flex ga-3 mb-3 align-center"
                      >
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

                        <v-checkbox
                          v-model="row.isPaid"
                          color="primary"
                          label="可發佣"
                          hide-details
                        />

                        <v-btn variant="plain" icon="delete" @click="removeLecturerRow(index)" />
                      </div>

                      <v-btn
                        variant="text"
                        prepend-icon="add"
                        color="primary"
                        @click="addLecturerRow"
                      >
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
                            {{ item.raw.profiles?.email
                            }}{{ '(' + item.raw.profiles?.idNumber + ')' }}
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
                  佣金依付款月份發放：每筆訂單可能包含多次付款，9 月付款金額於 9 月發放，10
                  月付款金額於 10 月發放，依此類推。
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
                      <td>{{ payment?.paymentMethodName || '信用卡' }}</td>
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
                <v-text-field
                  v-model="order.contractNumber"
                  label="編號"
                  hide-details
                ></v-text-field>
              </v-card-text>
            </v-card>
            <v-card variant="flat" class="mb-3">
              <v-card-title class="d-flex">
                備註
                <v-spacer></v-spacer>
                <v-btn size="small" variant="flat" color="primary" @click="saveAdminRemark"
                  >儲存</v-btn
                >
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
      <v-navigation-drawer
        v-model="subscriptionDrawer.open"
        location="right"
        temporary
        width="720"
        class="subscription-detail-drawer"
      >
        <div class="subscription-drawer-header">
          <div>
            <h2 class="mb-1">訂閱明細</h2>
            <p class="text-medium-emphasis mb-0">
              {{ subscriptionDrawer.item?.periodNo || '-' }}
            </p>
          </div>
          <v-btn icon="close" variant="text" @click="subscriptionDrawer.open = false" />
        </div>

        <div v-if="subscriptionDrawer.item" class="subscription-drawer-body">
          <v-card variant="outlined" class="mb-3">
            <v-card-title class="text-subtitle-1 d-flex align-center">
              訂閱主檔
              <v-spacer />
              <v-chip
                size="small"
                variant="tonal"
                :color="formatSubscriptionStatus(subscriptionDrawer.item.status).color"
              >
                {{ formatSubscriptionStatus(subscriptionDrawer.item.status).text }}
              </v-chip>
            </v-card-title>
            <v-table density="compact">
              <tbody>
                <tr v-for="row in subscriptionDetailRows" :key="row.label">
                  <th class="text-no-wrap">{{ row.label }}</th>
                  <td>{{ row.value }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>

          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">每期繳費紀錄</v-card-title>
            <div class="subscription-charge-table-wrap">
              <v-table density="compact" class="subscription-charge-table">
                <thead>
                  <tr>
                    <th>期數</th>
                    <th>預計扣款日</th>
                    <th>金額</th>
                    <th>狀態</th>
                    <th>付款日</th>
                    <th>金流單號</th>
                    <th>嘗試</th>
                  </tr>
                </thead>
                <tbody>
                  <template
                    v-for="charge in drawerSubscriptionCharges"
                    :key="charge.productSubscriptionChargeId"
                  >
                    <tr>
                      <td>{{ charge.cycleNo ?? '-' }}</td>
                      <td>{{ formatDateTime(charge.scheduledAt, 'YYYY/MM/DD') }}</td>
                      <td>{{ formatMoney(charge.amount, charge.currency) }}</td>
                      <td>
                        <v-chip
                          size="small"
                          variant="tonal"
                          :color="formatSubscriptionChargeStatus(charge.status).color"
                        >
                          {{ formatSubscriptionChargeStatus(charge.status).text }}
                        </v-chip>
                      </td>
                      <td>{{ formatDateTime(charge.paidAt, 'YYYY/MM/DD HH:mm') }}</td>
                      <td class="subscription-trade-no">{{ charge.newebTradeNo || '-' }}</td>
                      <td>{{ charge.attemptCount ?? 0 }}</td>
                    </tr>
                    <tr
                      v-if="charge.failureMessage || charge.failureCode"
                      class="subscription-note-row"
                    >
                      <td colspan="7">
                        失敗原因：{{ charge.failureCode || '-' }} {{ charge.failureMessage || '' }}
                      </td>
                    </tr>
                    <tr v-if="charge.payments?.length" class="subscription-payment-row">
                      <td colspan="7">
                        <div class="font-weight-medium mb-2">付款紀錄</div>
                        <div class="subscription-payment-list">
                          <div
                            v-for="payment in charge.payments"
                            :key="payment.productOrderPaymentId"
                            class="subscription-payment-item"
                          >
                            <div class="subscription-payment-line">
                              <div class="subscription-payment-cell">
                                <span class="subscription-payment-label">金流單號</span>
                                <span class="subscription-payment-value subscription-payment-no">
                                  {{ payment.merchantOrderNo || payment.externalTradeNo || '-' }}
                                </span>
                              </div>
                              <div class="subscription-payment-cell">
                                <span class="subscription-payment-label">狀態</span>
                                <v-chip
                                  size="x-small"
                                  variant="tonal"
                                  :color="formatPaymentStatusColor(payment.status)"
                                >
                                  {{ formatPaymentStatusText(payment.status) }}
                                </v-chip>
                              </div>
                              <div class="subscription-payment-cell">
                                <span class="subscription-payment-label">金額</span>
                                <span class="subscription-payment-value">
                                  {{ formatMoney(payment.amount, payment.currency) }}
                                </span>
                              </div>
                              <div class="subscription-payment-cell">
                                <span class="subscription-payment-label">付款時間</span>
                                <span class="subscription-payment-value">
                                  {{ formatDateTime(payment.paidAt, 'YYYY/MM/DD HH:mm') }}
                                </span>
                              </div>
                            </div>
                            <div v-if="payment.failureMessage" class="subscription-payment-error">
                              失敗原因：{{ payment.failureMessage }}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                  <tr v-if="!drawerSubscriptionCharges.length">
                    <td colspan="7" class="text-center text-medium-emphasis py-6">尚無繳費紀錄</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card>
        </div>
      </v-navigation-drawer>
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
    </div>
    <!-- order-detail-body -->
  </div>
</template>
<script setup>
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDateFormat } from '@/utils/formatDate'
import FileImage from '@/components/FileImageComponent.vue'
import { useProductRules } from '@/utils/rules'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  id: Number,
})

/* ------ 身分認證 ----------- */
const authStore = useAuthStore()

const router = useRouter()
const rules = useProductRules()
const dialog = useDialogStore()

function goBack() {
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    router.push({ name: 'Order' })
  }
}

const order = ref({}) // 第一層
const salesOrderItem = computed(() => order.value?.salesOrderItems ?? [])
const productOrderPayment = computed(() => order.value?.productOrderPayments ?? [])
const subscriptionRecords = computed(() => {
  const raw = salesOrderItem.value?.subscription ?? []
  return Array.isArray(raw) ? raw : []
})
const primarySubscription = computed(() => subscriptionRecords.value[0] ?? null)
const hasSubscription = computed(() => subscriptionRecords.value.length > 0)
const subscriptionCharges = computed(() => primarySubscription.value?.charges ?? [])
const totalSubscriptionPeriodCount = computed(() =>
  getSubscriptionTotalPeriods(primarySubscription.value),
)
const paidSubscriptionChargeCount = computed(
  () => subscriptionCharges.value.filter((charge) => isPaidStatus(charge?.status)).length,
)
const subscriptionDrawer = ref({
  open: false,
  item: null,
})
const drawerSubscriptionCharges = computed(() => subscriptionDrawer.value.item?.charges ?? [])
const subscriptionDetailRows = computed(() => {
  const item = subscriptionDrawer.value.item
  if (!item) return []

  return [
    { label: '委託單號', value: item.periodNo || '-' },
    { label: '訂閱狀態', value: formatSubscriptionStatus(item.status).text },
    { label: '訂閱週期', value: formatPeriodLabel(item) },
    { label: '總期數', value: item.periodTimes ?? '-' },
    {
      label: '已付款期數',
      value: `${countPaidCharges(item)} / ${getSubscriptionTotalPeriods(item)}`,
    },
    { label: '商品名稱', value: item.itemName || salesOrderItem.value?.productName || '-' },
    { label: '商品ID', value: item.productId ?? salesOrderItem.value?.productId ?? '-' },
    { label: '規格ID', value: item.variantId ?? salesOrderItem.value?.variantId ?? '-' },
    { label: '單期金額', value: formatMoney(item.unitPrice, item.currency) },
    { label: '起始日', value: formatDateTime(item.startedAt, 'YYYY/MM/DD HH:mm') },
    { label: '下次扣款日', value: formatDateTime(item.nextChargeDate, 'YYYY/MM/DD') },
    { label: '本期結束日', value: formatDateTime(item.currentPeriodEndsAt, 'YYYY/MM/DD') },
    { label: '最後扣款日', value: formatDateTime(item.lastChargedAt, 'YYYY/MM/DD HH:mm') },
    { label: '結束日', value: formatDateTime(item.endedAt, 'YYYY/MM/DD HH:mm') },
    { label: '取消原因', value: item.cancelReason || '-' },
    { label: '備註', value: item.note || '-' },
  ]
})
const revenueShare = computed(() => salesOrderItem.value?.revenueShares ?? null)
const currentRevenueShareScheme = computed(
  () => salesOrderItem.value?.currentRevenueShareScheme ?? null,
)
const currentProductStatus = computed(() => salesOrderItem.value?.currentProductStatus ?? null)
const revenueShareDraft = ref({})
const savingRevenueShare = ref(false)
const shareTypeOptions = [
  { title: '百分比', value: 'PERCENT' },
  { title: '固定金額', value: 'FIXED' },
]

const revenueCompareFields = [
  { key: 'schemeName', label: '分潤模板', kind: 'text' },
  { key: 'isRevenueShare', label: '是否分潤', kind: 'bool' },
  { key: 'companyValue', label: '公司比例/金額', kind: 'number' },
  { key: 'consultantType', label: '類型', shortLabel: '類型', kind: 'type' },
  {
    key: 'consultantValue',
    label: '數值',
    shortLabel: '數值',
    kind: 'number',
    typeKey: 'consultantType',
  },
  { key: 'lecturerType', label: '類型', shortLabel: '類型', kind: 'type' },
  {
    key: 'lecturerValue',
    label: '數值',
    shortLabel: '數值',
    kind: 'number',
    typeKey: 'lecturerType',
  },
  { key: 'partnerName', label: '乙方名稱', kind: 'text' },
  { key: 'partnerShareType', label: '類型', shortLabel: '類型', kind: 'type' },
  {
    key: 'partnerShareValue',
    label: '數值',
    shortLabel: '數值',
    kind: 'number',
    typeKey: 'partnerShareType',
  },
  { key: 'adminFeeType', label: '類型', shortLabel: '類型', kind: 'type' },
  {
    key: 'adminFeeValue',
    label: '數值',
    shortLabel: '數值',
    kind: 'number',
    typeKey: 'adminFeeType',
  },
  { key: 'usageFeeType', label: '類型', shortLabel: '類型', kind: 'type' },
  {
    key: 'usageFeeValue',
    label: '數值',
    shortLabel: '數值',
    kind: 'number',
    typeKey: 'usageFeeType',
  },
  { key: 'managementFeeType', label: '類型', shortLabel: '類型', kind: 'type' },
  {
    key: 'managementFeeValue',
    label: '數值',
    shortLabel: '數值',
    kind: 'number',
    typeKey: 'managementFeeType',
  },
]

const revenueCompareRows = [
  { key: 'schemeName', label: '分潤模板', fields: [revenueCompareFields[0]] },
  { key: 'isRevenueShare', label: '是否分潤', fields: [revenueCompareFields[1]] },
  { key: 'companyValue', label: '公司比例/金額', fields: [revenueCompareFields[2]] },
  {
    key: 'consultant',
    label: '顧問分潤',
    fields: ['consultantValue', 'consultantType']
      .map((key) => revenueCompareFields.find((field) => field.key === key))
      .filter(Boolean),
  },
  {
    key: 'lecturer',
    label: '講師分潤',
    fields: ['lecturerValue', 'lecturerType']
      .map((key) => revenueCompareFields.find((field) => field.key === key))
      .filter(Boolean),
  },
  { key: 'partnerName', label: '乙方名稱', fields: [revenueCompareFields[7]] },
  {
    key: 'partnerShare',
    label: '乙方分潤',
    fields: ['partnerShareValue', 'partnerShareType']
      .map((key) => revenueCompareFields.find((field) => field.key === key))
      .filter(Boolean),
  },
  {
    key: 'adminFee',
    label: '行政費',
    fields: ['adminFeeValue', 'adminFeeType']
      .map((key) => revenueCompareFields.find((field) => field.key === key))
      .filter(Boolean),
  },
  {
    key: 'usageFee',
    label: '使用費',
    fields: ['usageFeeValue', 'usageFeeType']
      .map((key) => revenueCompareFields.find((field) => field.key === key))
      .filter(Boolean),
  },
  {
    key: 'managementFee',
    label: '管理費',
    fields: ['managementFeeValue', 'managementFeeType']
      .map((key) => revenueCompareFields.find((field) => field.key === key))
      .filter(Boolean),
  },
]

function formatShareValue(value, type = null) {
  if (value === null || value === undefined || value === '') return '-'
  const normalizedType = String(type || '').toUpperCase()
  if (normalizedType === 'PERCENT') return `${value}%`
  if (normalizedType === 'FIXED') return `${value} 元`
  return value
}

function formatShareType(type) {
  return shareTypeOptions.find((item) => item.value === type)?.title ?? type ?? '-'
}

function cloneRevenueShareDraft(source) {
  if (!source) return {}
  return revenueCompareFields.reduce((acc, field) => {
    acc[field.key] =
      source[field.key] ?? (field.kind === 'number' ? 0 : field.kind === 'bool' ? false : '')
    return acc
  }, {})
}

watch(
  revenueShare,
  (value) => {
    revenueShareDraft.value = cloneRevenueShareDraft(value)
  },
  { immediate: true },
)

function normalizeRevenueCompareValue(value, kind) {
  if (kind === 'number') return Number(value ?? 0)
  if (kind === 'bool') return Boolean(value)
  return String(value ?? '').trim()
}

function isRevenueShareDifferent(key) {
  const field = revenueCompareFields.find((item) => item.key === key)
  if (!field) return false
  const currentValue = normalizeRevenueCompareValue(
    currentRevenueShareScheme.value?.[key],
    field.kind,
  )
  const snapshotValue = normalizeRevenueCompareValue(revenueShareDraft.value?.[key], field.kind)
  return currentValue !== snapshotValue
}

function isRevenueShareRowDifferent(row) {
  return row.fields.some((field) => isRevenueShareDifferent(field.key))
}

const revenueCompareExpanded = ref(false)
const revenueDiffCount = computed(
  () => revenueCompareRows.filter((row) => isRevenueShareRowDifferent(row)).length,
)
const hasRevenueShareDiff = computed(() => revenueDiffCount.value > 0)
const revenueCompareStatusText = computed(() =>
  hasRevenueShareDiff.value ? `異常 ${revenueDiffCount.value} 項` : '正常',
)

function toggleRevenueCompare() {
  revenueCompareExpanded.value = !revenueCompareExpanded.value
}

watch(
  hasRevenueShareDiff,
  (hasDiff) => {
    revenueCompareExpanded.value = hasDiff
  },
  { immediate: true },
)

function formatRevenueFieldValue(source, field) {
  if (!source) return '-'
  if (field.kind === 'bool') return source[field.key] ? '是' : '否'
  if (field.kind === 'number') return formatShareValue(source[field.key], source[field.typeKey])
  if (field.kind === 'type') return formatShareType(source[field.key])
  return source[field.key] ?? '-'
}

function formatRevenueRowValue(source, row) {
  if (!source) return '-'
  const valueField = row.fields.find((field) => field.kind === 'number')
  const typeField = row.fields.find((field) => field.kind === 'type')
  if (valueField && typeField) {
    const value = source[valueField.key]
    const type = source[typeField.key]
    if (value === null || value === undefined || value === '') return '-'
    return `${value} / ${formatShareType(type)}`
  }

  return (
    row.fields
      .map((field) => formatRevenueFieldValue(source, field))
      .filter((value) => value !== '-')
      .join(' / ') || '-'
  )
}

function getCurrentProductStatusColor(code) {
  if (!code || code === 'OK') return 'success'
  if (code === 'PRODUCT_CHANGED' || code === 'VARIANT_CHANGED' || code === 'REVENUE_SCHEME_EMPTY') {
    return 'warning'
  }
  return 'error'
}

function getRevenueFieldSuffix(source, field) {
  const type = String(source?.[field.typeKey] ?? '').toUpperCase()
  if (type === 'PERCENT') return '%'
  if (type === 'FIXED') return '元'
  return ''
}

async function saveRevenueShareSnapshot() {
  if (!salesOrderItem.value?.salesOrderItemId) return

  savingRevenueShare.value = true
  try {
    await api.patch(
      `/Order/RevenueShare/${salesOrderItem.value.salesOrderItemId}`,
      revenueShareDraft.value,
    )
    await fetchOrder(props.id)
    dialog.showSuccess('更新成功', '下單分潤紀錄已更新')
  } catch (err) {
    dialog.showAxiosError(err, '下單分潤紀錄更新失敗')
  } finally {
    savingRevenueShare.value = false
  }
}

const member = ref()

const consultantForm = ref(null)
const consultantCategories = ref([]) //顧問師類別
const consultantRows = ref([]) // 顧問師列表
const consultantMap = ref(new Map()) // key: categoryId, value: 人員陣列
const consultantLoadingMap = ref(new Map()) // key: categoryId, value: boolean

const lecturerForm = ref(null)
const lecturerRows = ref([]) // 講師列表

const specTypeList = computed(() => {
  return splitSpecSummary(salesOrderItem.value?.specSummary)
})

const currentSpecTypeList = computed(() => {
  return splitSpecSummary(currentProductStatus.value?.currentSpecSummary)
})

// 比對兩段文字，回傳分段陣列；不同的片段標記 changed=true 供高亮顯示。
// 以共同前綴/共同後綴切分，中間相異的部分即為差異區段。
function diffTextSegments(self, other) {
  const a = self ?? ''
  const b = other ?? ''
  if (a === b) return [{ text: a, changed: false }]

  let start = 0
  const minLen = Math.min(a.length, b.length)
  while (start < minLen && a[start] === b[start]) start++

  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }

  const segments = []
  if (start > 0) segments.push({ text: a.slice(0, start), changed: false })
  if (endA > start) segments.push({ text: a.slice(start, endA), changed: true })
  if (endA < a.length) segments.push({ text: a.slice(endA), changed: false })
  return segments.length ? segments : [{ text: a, changed: false }]
}

// 下單規格相對於目前規格的差異分段（逐行依索引比對）
const snapshotSpecDiff = computed(() =>
  specTypeList.value.map((line, index) =>
    diffTextSegments(line, currentSpecTypeList.value[index] ?? ''),
  ),
)

// 目前規格相對於下單規格的差異分段
const currentSpecDiff = computed(() =>
  currentSpecTypeList.value.map((line, index) =>
    diffTextSegments(line, specTypeList.value[index] ?? ''),
  ),
)

const snapshotProductNameDiff = computed(() =>
  diffTextSegments(salesOrderItem.value?.productName || '-', currentProductStatus.value?.currentProductName || '-'),
)

const currentProductNameDiff = computed(() =>
  diffTextSegments(currentProductStatus.value?.currentProductName || '-', salesOrderItem.value?.productName || '-'),
)

const productCompareExpanded = ref(false)
const hasSpecDiff = computed(() => {
  const snapshotSpecs = specTypeList.value
  const currentSpecs = currentSpecTypeList.value
  if (!snapshotSpecs.length && !currentSpecs.length) return false
  if (snapshotSpecs.length !== currentSpecs.length) return true
  return snapshotSpecs.some((line, index) => line !== currentSpecs[index])
})
const hasCurrentProductStatusIssue = computed(() => {
  const code = String(currentProductStatus.value?.code || '').toUpperCase()
  return Boolean(code && code !== 'OK')
})
const hasCurrentProductFieldDiff = computed(() =>
  ['productName', 'productId', 'variantId', 'sku'].some((field) =>
    isCurrentProductFieldDifferent(field),
  ),
)
const hasProductCompareDiff = computed(
  () => hasCurrentProductStatusIssue.value || hasCurrentProductFieldDiff.value || hasSpecDiff.value,
)
const productCompareStatusColor = computed(() => {
  if (!hasProductCompareDiff.value) return 'success'
  if (hasCurrentProductStatusIssue.value) {
    return getCurrentProductStatusColor(currentProductStatus.value?.code)
  }
  return 'warning'
})
const productCompareStatusText = computed(() => {
  if (!hasProductCompareDiff.value) return '正常'
  return currentProductStatus.value?.message || '異常'
})
const productCompareAccentTextClass = computed(() => `text-${productCompareStatusColor.value}`)

function normalizeProductCompareValue(value) {
  return String(value ?? '').trim()
}

function isCurrentProductFieldDifferent(field) {
  const fieldMap = {
    productName: ['productName', 'currentProductName'],
    productId: ['productId', 'currentProductId'],
    variantId: ['variantId', 'currentVariantId'],
    sku: ['sku', 'currentSku'],
  }
  const keys = fieldMap[field]
  if (!keys) return false
  const [snapshotKey, currentKey] = keys
  return (
    normalizeProductCompareValue(salesOrderItem.value?.[snapshotKey]) !==
    normalizeProductCompareValue(currentProductStatus.value?.[currentKey])
  )
}

function getCurrentProductFieldColor(field) {
  return isCurrentProductFieldDifferent(field) ? productCompareStatusColor.value : undefined
}

function toggleProductCompare() {
  productCompareExpanded.value = !productCompareExpanded.value
}

watch(
  hasProductCompareDiff,
  (hasDiff) => {
    productCompareExpanded.value = hasDiff
  },
  { immediate: true },
)

const currentProductRoute = computed(() => {
  const productId = currentProductStatus.value?.currentProductId
  if (!productId || currentProductStatus.value?.productFound === false) return null
  const variantId = currentProductStatus.value?.currentVariantId
  return {
    name: 'ProductEdit',
    params: { id: productId },
    query: variantId ? { variantId: String(variantId) } : undefined,
  }
})

function openCurrentProduct() {
  if (!currentProductRoute.value) return
  router.push(currentProductRoute.value)
}

function splitSpecSummary(specSummary) {
  if (!specSummary) return [] // 沒資料就回傳空陣列
  return specSummary.split('｜').map((s) => s.trim()) // 去掉前後空白
}

function openSubscriptionDrawer(item) {
  if (!item) return
  subscriptionDrawer.value = {
    open: true,
    item,
  }
}

function formatDateTime(value, format = 'YYYY/MM/DD HH:mm') {
  if (!value) return '-'
  return useDateFormat(value, format).value
}

function formatMoney(value, currency = 'TWD') {
  if (value === null || value === undefined || value === '') return '-'
  const amount = Number(value)
  if (Number.isNaN(amount)) return value

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency || 'TWD',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

function isPaidStatus(status) {
  return String(status || '').toUpperCase() === 'PAID'
}

function countPaidCharges(item) {
  return (item?.charges ?? []).filter((charge) => isPaidStatus(charge?.status)).length
}

function getSubscriptionTotalPeriods(item) {
  const periodTimes = Number(item?.periodTimes)
  if (Number.isFinite(periodTimes) && periodTimes > 0) return periodTimes
  return item?.charges?.length ?? 0
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

function formatSubscriptionChargeStatus(status) {
  const map = {
    CREATED: { text: '已建立', color: 'info' },
    PENDING: { text: '待扣款', color: 'warning' },
    UNPAID: { text: '未付款', color: 'warning' },
    PAID: { text: '已付款', color: 'success' },
    FAILED: { text: '扣款失敗', color: 'error' },
    RETRYING: { text: '重試中', color: 'warning' },
    CANCELLED: { text: '已取消', color: 'grey' },
    REFUNDED: { text: '已退款', color: 'info' },
  }
  const key = String(status || '').toUpperCase()
  return map[key] ?? { text: status || '-', color: 'grey' }
}

// 訂閱週期翻譯（依藍新 PeriodType/PeriodPoint）：每月 9 號、每週 星期一、每年 03/12
function formatPeriodLabel(item) {
  const type = String(item?.periodType || '').toUpperCase()
  const point = item?.periodPoint
  if (!type) return '-'
  switch (type) {
    case 'D':
    case 'DAY':
      return point ? `每 ${point} 天` : '每日'
    case 'W':
    case 'WEEK': {
      const week = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日' }
      return point ? `每週 星期${week[Number(point)] ?? point}` : '每週'
    }
    case 'M':
    case 'MONTH':
      return point ? `每月 ${point} 號` : '每月'
    case 'Y':
    case 'YEAR': {
      const p = String(point ?? '')
      if (p.length === 4) return `每年 ${p.slice(0, 2)}/${p.slice(2)}`
      return point ? `每年 ${point}` : '每年'
    }
    default:
      return point ? `${item.periodType} ${point}` : item.periodType
  }
}

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

function getNonRefundableReason(methodId) {
  const map = {
    2: '轉帳/匯款，請手動線下處理',
    3: '定期定額訂閱制，不支援單次退款 API',
    4: '詢價/報價，無付款紀錄',
  }
  return map[methodId] || '不支援線上退款'
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

/* 退款/取消授權 */
async function refundOrder(id) {
  const ok = await dialog.askConfirm({
    title: '確認退款/取消授權',
    message: '將透過藍新金流進行取消授權或退款作業，此操作無法復原。',
    isDelete: true,
  })

  if (!ok) return

  dialog.showLoading()
  try {
    const { data } = await api.post(`/Order/Refund/${id}`)
    dialog.showSuccess('退款成功', data.message || '已成功取消授權/退款')
    await fetchOrder(props.id)
  } catch (error) {
    dialog.showAxiosError(error, '退款失敗')
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
.order-detail-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.main {
  min-height: 100vh;
  background: rgb(var(--v-theme-secondary));
}

.upline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.order-data-header,
.revenue-compare-header {
  gap: 4px;
}

.order-product-compare-row {
  align-items: stretch;
}

.order-snapshot-product-col.is-current-collapsed {
  flex: 1 1 calc(100% - 60px);
  max-width: calc(100% - 60px);
}

.order-current-product-col.is-collapsed {
  flex: 0 0 60px;
  max-width: 60px;
}

.order-current-product-col {
  display: flex;
  min-width: 0;
}

.current-product-compare-shell {
  display: flex !important;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
}

.current-product-compare-shell.is-success {
  border-color: rgb(var(--v-theme-success));
}

.current-product-compare-shell.is-warning {
  border-color: rgb(var(--v-theme-warning));
}

.current-product-compare-shell.is-error {
  border-color: rgb(var(--v-theme-error));
}

.order-current-product-content {
  flex: 1 1 auto;
  min-width: 0;
}

.order-current-product-content.is-clickable {
  cursor: pointer;
}

.order-current-product-content.is-clickable:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}

.order-current-product-content:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.order-current-product-content :deep(.v-card-title) {
  min-width: 0;
}

.order-current-product-content :deep(.v-card-text) {
  min-width: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.order-current-product-content :deep(.v-chip:not(.v-chip--variant-tonal)) {
  color: inherit;
}

.current-product-toggle-rail {
  flex: 0 0 50px;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.72);
}

.current-product-toggle-rail:hover,
.current-product-toggle-rail:focus-visible {
  background: rgba(var(--v-theme-primary), 0.06);
  outline: none;
}

.spec-diff-highlight {
  background: rgba(var(--v-theme-error), 0.18);
  color: rgb(var(--v-theme-error));
  font-weight: 700;
  border-radius: 3px;
  padding: 0 2px;
}

.revenue-diff-row {
  background: rgba(var(--v-theme-warning), 0.16);
}

.revenue-diff-row th {
  color: rgb(var(--v-theme-warning));
}

.revenue-edit-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  align-items: center;
}

.revenue-compare-cell {
  height: 42px;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  vertical-align: middle;
}

.revenue-edit-row :deep(.v-field__input) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 2px;
}

.revenue-edit-row :deep(.v-select__selection) {
  margin-top: 0;
}

.subscription-summary-card {
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.subscription-summary-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.subscription-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 18px;
}

.subscription-detail-drawer {
  background: #fff;
}

.subscription-drawer-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.subscription-drawer-body {
  padding: 16px 24px 28px;
}

.subscription-charge-table-wrap {
  overflow-x: auto;
}

.subscription-charge-table {
  min-width: 760px;
}

.subscription-charge-table :deep(th),
.subscription-charge-table :deep(td) {
  white-space: nowrap;
  vertical-align: middle;
}

.subscription-charge-table :deep(td) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

.subscription-trade-no {
  font-weight: 500;
}

.subscription-note-row td {
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  white-space: normal !important;
}

.subscription-payment-row td {
  background: rgba(var(--v-theme-primary), 0.06);
  padding: 12px 16px !important;
  white-space: normal !important;
}

.subscription-payment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subscription-payment-item {
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.72);
}

.subscription-payment-line {
  display: grid;
  grid-template-columns: minmax(180px, 1.5fr) 82px 100px minmax(150px, 1fr);
  gap: 12px;
  align-items: start;
}

.subscription-payment-cell {
  min-width: 0;
}

.subscription-payment-label {
  display: block;
  margin-bottom: 2px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.75rem;
  line-height: 1.25;
}

.subscription-payment-value {
  display: block;
  min-width: 0;
  font-weight: 500;
  line-height: 1.4;
}

.subscription-payment-no,
.subscription-payment-error {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.subscription-payment-error {
  margin-top: 8px;
  color: rgb(var(--v-theme-error));
  font-size: 0.875rem;
}

@media (max-width: 960px) {
  .subscription-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .subscription-summary-grid {
    grid-template-columns: 1fr;
  }

  .subscription-payment-line {
    grid-template-columns: 1fr;
  }
}
</style>
