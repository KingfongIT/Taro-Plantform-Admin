<template>
  <v-container fluid class="pa-6">
    <!-- 標題與簡介 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold primary--text">每月發佣整合結算作業</h2>
        <p class="text-subtitle-2 text-grey-darken-1">系統每月 5 號自動結算上月分潤；10 號手動進行關帳發佣並更新小芋頭雞肉飼料。</p>
      </div>
    </div>

    <!-- 月份與狀態區塊 -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card border flat class="pa-4 h-100 d-flex flex-column justify-center">
          <div class="d-flex align-center ga-2">
            <v-menu
              v-model="monthMenu"
              :close-on-content-click="false"
              location="bottom start"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-model="yearMonth"
                  label="選擇結算月份"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  prepend-inner-icon="calendar_today"
                  color="primary"
                  v-bind="props"
                  class="flex-grow-1 cursor-pointer"
                  style="cursor: pointer;"
                ></v-text-field>
              </template>

              <v-card width="290" class="pa-3" border flat elevation="3">
                <!-- 年份選擇列 -->
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-btn
                    icon="chevron_left"
                    variant="text"
                    density="comfortable"
                    @click="pickerYear--"
                  ></v-btn>
                  <span class="text-subtitle-1 font-weight-bold">{{ pickerYear }} 年</span>
                  <v-btn
                    icon="chevron_right"
                    variant="text"
                    density="comfortable"
                    :disabled="pickerYear >= maxYear"
                    @click="pickerYear++"
                  ></v-btn>
                </div>

                <!-- 3x4 月份格線 -->
                <v-row class="ma-0" dense>
                  <v-col
                    v-for="(mName, idx) in monthNames"
                    :key="idx"
                    cols="4"
                    class="text-center pa-1"
                  >
                    <v-btn
                      variant="tonal"
                      :color="isSelectedMonth(idx) ? 'primary' : 'default'"
                      :disabled="isMonthDisabled(idx)"
                      block
                      size="small"
                      class="text-body-2 font-weight-bold"
                      @click="selectMonth(idx)"
                    >
                      {{ mName }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
            <v-btn
              color="primary"
              variant="flat"
              icon="refresh"
              density="comfortable"
              :loading="loading"
              @click="fetchData"
              style="height: 44px; min-width: 44px;"
            ></v-btn>
          </div>
          <v-btn
            v-if="status.isSettled"
            color="error"
            variant="tonal"
            size="small"
            class="mt-3 w-100"
            prepend-icon="delete_sweep"
            :loading="resetLoading"
            @click="triggerResetMonth"
          >
            重置並重算此月份
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card border flat class="pa-4 h-100">
          <div class="text-subtitle-1 font-weight-medium mb-3">流程執行狀態</div>
          <v-row>
            <!-- 5號結算狀態 -->
            <v-col cols="12" sm="6">
              <v-card variant="tonal" :color="status.isSettled ? 'success' : 'warning'" class="pa-3">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-body-2 font-weight-bold">每月 5 號系統結算</span>
                  <v-chip :color="status.isSettled ? 'success' : 'warning'" size="small" variant="flat">
                    {{ status.isSettled ? '已結算' : '未結算' }}
                  </v-chip>
                </div>
                <div class="text-caption text-grey-darken-3">
                  {{ status.isSettled ? `結算時間：${formatDate(status.settledAt)}` : '上月訂單分潤尚未執行結算' }}
                </div>
                <v-btn
                  v-if="!status.isSettled && yearMonth"
                  size="small"
                  color="primary"
                  variant="outlined"
                  class="mt-2"
                  :loading="actionLoading"
                  @click="triggerManualSettle"
                >
                  手動執行試算結算
                </v-btn>
              </v-card>
            </v-col>

            <!-- 10號關帳狀態 -->
            <v-col cols="12" sm="6">
              <v-card variant="tonal" :color="status.isClosed ? 'info' : 'warning'" class="pa-3">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-body-2 font-weight-bold">每月 10 號行政關帳</span>
                  <v-chip :color="status.isClosed ? 'info' : 'warning'" size="small" variant="flat">
                    {{ status.isClosed ? '已關帳' : '未關帳' }}
                  </v-chip>
                </div>
                <div class="text-caption text-grey-darken-3">
                  {{ status.isClosed ? `關帳人員：${status.closedBy || '系統'} | ${formatDate(status.closedAt)}` : '尚未執行本期關帳發放' }}
                </div>
                <v-btn
                  v-if="status.isSettled && !status.isClosed"
                  size="small"
                  color="error"
                  variant="flat"
                  class="mt-2"
                  @click="openCloseDialog"
                >
                  執行關帳發佣
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- 已結算：收支與發放彙總儀表板 -->
    <v-row v-if="status.isSettled" class="mb-6">
      <v-col cols="12" md="7">
        <v-card border flat class="pa-4 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <span class="text-subtitle-1 font-weight-bold d-flex align-center ga-2">
              <v-icon color="primary">analytics</v-icon>
              <span>本月收支與發放彙總</span>
            </span>
            <v-chip v-if="summaryLoading" size="small" color="primary" variant="text">
              <v-progress-circular indeterminate size="14" width="2" class="mr-1"></v-progress-circular>
              計算中...
            </v-chip>
          </div>
          
          <!-- 主要收支指標 -->
          <v-row class="mb-4">
            <v-col cols="12" sm="4">
              <div class="bg-indigo-lighten-5 pa-3 rounded-lg text-center h-100 border-start border-indigo border-lg" style="border-left: 4px solid #3f51b5 !important;">
                <div class="text-caption text-indigo-darken-2 font-weight-bold mb-1">本月總營收 (A)</div>
                <div class="text-h6 font-weight-black text-indigo-darken-4">NT$ {{ formatNumber(summaryData.totalRevenue) }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="bg-orange-lighten-5 pa-3 rounded-lg text-center h-100 border-start border-orange border-lg" style="border-left: 4px solid #ff9800 !important;">
                <div class="text-caption text-orange-darken-2 font-weight-bold mb-1">本月總發放 (B)</div>
                <div class="text-h6 font-weight-black text-orange-darken-4">NT$ {{ formatNumber(totalPayout) }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div :class="totalNetProfit >= 0 ? 'bg-green-lighten-5 border-green' : 'bg-red-lighten-5 border-red'" class="pa-3 rounded-lg text-center h-100 border-start border-lg" :style="{ borderLeft: totalNetProfit >= 0 ? '4px solid #4caf50 !important' : '4px solid #f44336 !important' }">
                <div :class="totalNetProfit >= 0 ? 'text-green-darken-2' : 'text-red-darken-2'" class="text-caption font-weight-bold mb-1">公司保留淨利 (A - B)</div>
                <div :class="totalNetProfit >= 0 ? 'text-green-darken-4' : 'text-red-darken-4'" class="text-h6 font-weight-black">NT$ {{ formatNumber(totalNetProfit) }}</div>
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- 單位發放明細列表 -->
          <div class="text-subtitle-2 font-weight-bold mb-3 text-grey-darken-3">各單位發放細項與佔比：</div>
          
          <div class="d-flex flex-column ga-3">
            <!-- 代理商分潤 -->
            <div class="d-flex align-center justify-space-between py-1">
              <div class="d-flex align-center ga-2">
                <div class="rounded-circle" style="width: 12px; height: 12px; background-color: #4f46e5;"></div>
                <span class="text-body-2 font-weight-medium text-grey-darken-4">代理商分潤</span>
                <span class="text-caption text-grey-darken-1">(DFYC)</span>
              </div>
              <div class="text-right">
                <span class="text-body-2 font-weight-bold text-grey-darken-4">NT$ {{ formatNumber(totalAgentCommission) }}</span>
                <v-chip size="x-small" color="indigo" class="ml-2 font-weight-bold" variant="flat">{{ agentPercentage }}%</v-chip>
              </div>
            </div>

            <!-- 管理費 -->
            <div class="d-flex align-center justify-space-between py-1">
              <div class="d-flex align-center ga-2">
                <div class="rounded-circle" style="width: 12px; height: 12px; background-color: #0d9488;"></div>
                <span class="text-body-2 font-weight-medium text-grey-darken-4">管理費</span>
                <span class="text-caption text-grey-darken-1">(MFYC + UFYC 管理人員)</span>
              </div>
              <div class="text-right">
                <span class="text-body-2 font-weight-bold text-grey-darken-4">NT$ {{ formatNumber(totalMgmtFee) }}</span>
                <v-chip size="x-small" color="teal" class="ml-2 font-weight-bold" variant="flat">{{ mgmtPercentage }}%</v-chip>
              </div>
            </div>

            <!-- 顧問/講師費 -->
            <div class="d-flex align-center justify-space-between py-1">
              <div class="d-flex align-center ga-2">
                <div class="rounded-circle" style="width: 12px; height: 12px; background-color: #f97316;"></div>
                <span class="text-body-2 font-weight-medium text-grey-darken-4">顧問/講師獎金</span>
                <span class="text-caption text-grey-darken-1">(CONSULTANT + LECTURER)</span>
              </div>
              <div class="text-right">
                <span class="text-body-2 font-weight-bold text-grey-darken-4">NT$ {{ formatNumber(totalConsultantFee) }}</span>
                <v-chip size="x-small" color="orange" class="ml-2 font-weight-bold" variant="flat">{{ consultantPercentage }}%</v-chip>
              </div>
            </div>

            <!-- 乙方費用 -->
            <div class="d-flex align-center justify-space-between py-1">
              <div class="d-flex align-center ga-2">
                <div class="rounded-circle" style="width: 12px; height: 12px; background-color: #db2777;"></div>
                <span class="text-body-2 font-weight-medium text-grey-darken-4">乙方費用</span>
                <span class="text-caption text-grey-darken-1">(PARTNER 專案拆分)</span>
              </div>
              <div class="text-right">
                <span class="text-body-2 font-weight-bold text-grey-darken-4">NT$ {{ formatNumber(totalPartnerFee) }}</span>
                <v-chip size="x-small" color="pink" class="ml-2 font-weight-bold" variant="flat">{{ partnerPercentage }}%</v-chip>
              </div>
            </div>

            <!-- 公司保留淨利 -->
            <div class="d-flex align-center justify-space-between py-1">
              <div class="d-flex align-center ga-2">
                <div class="rounded-circle" style="width: 12px; height: 12px; background-color: #16a34a;"></div>
                <span class="text-body-2 font-weight-medium text-grey-darken-4">公司保留淨利</span>
                <span class="text-caption text-grey-darken-1">(Net Profit)</span>
              </div>
              <div class="text-right">
                <span :class="totalNetProfit >= 0 ? 'text-green-darken-3' : 'text-red-darken-3'" class="text-body-2 font-weight-bold">NT$ {{ formatNumber(totalNetProfit) }}</span>
                <v-chip size="x-small" :color="totalNetProfit >= 0 ? 'success' : 'error'" class="ml-2 font-weight-bold" variant="flat">{{ netProfitPercentage }}%</v-chip>
              </div>
            </div>
          </div>

          <!-- 額外扣除稅額與保費註解 -->
          <v-divider class="my-3"></v-divider>
          <div class="d-flex justify-space-between text-caption text-grey-darken-1">
            <span>* 上述費用中代扣金額明細：</span>
            <span>
              代扣所得稅: <strong class="text-grey-darken-3">NT$ {{ formatNumber(summaryData.totalTaxDeduction) }}</strong> | 
              代扣補充保費: <strong class="text-grey-darken-3">NT$ {{ formatNumber(summaryData.totalPremiumDeduction) }}</strong>
            </span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card border flat class="pa-4 h-100 d-flex flex-column">
          <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center ga-2">
            <v-icon color="primary">pie_chart</v-icon>
            <span>總營收比例分佈</span>
          </div>
          
          <div class="flex-grow-1 d-flex align-center justify-center" style="min-height: 280px;">
            <ApexCharts
              v-if="!summaryLoading && chartSeries.some(v => v > 0)"
              type="donut"
              width="100%"
              height="280"
              :options="chartOptions"
              :series="chartSeries"
            />
            <div v-else-if="summaryLoading" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" class="mb-2"></v-progress-circular>
              <div class="text-caption text-grey">正在繪製圖表...</div>
            </div>
            <div v-else class="text-center py-6 text-grey">
              <v-icon size="48" class="mb-2">bar_chart</v-icon>
              <div class="text-caption">無有效收支資料可繪製圖表</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 已結算：顯示報表與紀錄 -->
    <v-row v-if="status.isSettled">
      <v-col cols="12">
        <v-card border flat>
          <div class="d-flex align-center justify-space-between bg-white pr-4">
            <v-tabs v-model="detailsTab" color="primary">
              <v-tab value="settlement">分潤結算明細</v-tab>
              <v-tab value="mgmtfee">管理費發放明細</v-tab>
              <v-tab value="consultant">顧問/講師獎金</v-tab>
              <v-tab value="partner">乙方費用</v-tab>
              <v-tab v-if="status.isClosed" value="payout">實際發放與扣除紀錄</v-tab>
              <v-tab v-else-if="status.isSettled" value="expectedPayout">預計發放與扣除預覽</v-tab>
            </v-tabs>
            <div class="d-flex ga-2" v-if="detailsTab !== 'payout'">
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                prepend-icon="visibility"
                @click="previewMonthlyAllInOne"
              >
                預覽整合報表
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                prepend-icon="download"
                @click="exportMonthlyAllInOne"
              >
                下載月分潤整合報表 (Excel)
              </v-btn>
            </div>
          </div>
          
          <v-divider></v-divider>
          
          <v-window v-model="detailsTab">
            <v-window-item value="settlement">
              <v-card-title class="py-3 px-4 bg-grey-lighten-4">
                <span class="text-subtitle-1 font-weight-bold">{{ status.isClosed ? '分潤結算明細 (已關帳)' : '分潤結算預覽 (草稿)' }}</span>
              </v-card-title>
              <v-divider></v-divider>

              <v-data-table
                :headers="settlementHeaders"
                :items="settlementItems"
                :loading="loading"
                class="elevation-0"
                no-data-text="查無結算明細資料"
              >
                <template #item.amount="{ item }">
                  <span class="font-weight-bold text-primary">{{ formatNumber(item.amount) }}</span>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- 管理費發放明細 (MFYC + UFYC管理人員) -->
            <v-window-item value="mgmtfee">
              <v-card-title class="d-flex align-center justify-space-between py-3 px-4 bg-grey-lighten-4">
                <span class="text-subtitle-1 font-weight-bold">管理費發放明細 (MFYC / UFYC 管理人員)</span>
                <div class="d-flex ga-2 align-center">
                  <v-btn
                    v-if="selectedMgmtIds.length > 0"
                    color="success" variant="flat" size="small" prepend-icon="check_circle"
                    @click="batchMarkStatus(selectedMgmtIds, 'PAID', 'mgmt')"
                  >批次標記為已發放 ({{ selectedMgmtIds.length }})</v-btn>
                </div>
              </v-card-title>
              <v-divider></v-divider>
              <v-data-table
                :headers="feeDetailHeaders"
                :items="mgmtFeeItems"
                :loading="feeLoading"
                v-model="selectedMgmtIds"
                show-select item-value="id"
                class="elevation-0" no-data-text="查無管理費明細"
              >
                <template #item.feeCategory="{ item }">
                  <v-chip size="small" :color="item.feeCategory === 'MFYC' ? 'deep-purple' : 'indigo'" variant="tonal">
                    {{ item.feeCategory === 'MFYC' ? '管理費 MFYC' : '使用費管理 UFYC' }}
                  </v-chip>
                </template>
                <template #item.rawAmount="{ item }"><span class="font-weight-medium">{{ formatNumber(item.rawAmount) }}</span></template>
                <template #item.taxAmount="{ item }"><span class="text-red-darken-2">-{{ formatNumber(item.taxAmount) }}</span></template>
                <template #item.premiumAmount="{ item }"><span class="text-orange-darken-2">-{{ formatNumber(item.premiumAmount) }}</span></template>
                <template #item.amount="{ item }"><span class="font-weight-bold text-success">{{ formatNumber(item.amount) }}</span></template>
                <template #item.payoutStatus="{ item }">
                  <v-chip size="small" :color="statusColor(item.payoutStatus)" variant="flat">{{ statusLabel(item.payoutStatus) }}</v-chip>
                </template>
                <template #item.actions="{ item }">
                  <v-btn size="small" variant="tonal" color="success" class="mr-2 font-weight-bold" @click="markSingleStatus(item, 'PAID')">標記發放</v-btn>
                  <v-btn size="small" variant="tonal" color="grey" class="font-weight-bold" @click="markSingleStatus(item, 'EXCLUDED')">歷史已付</v-btn>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- 顧問師/講師獎金 -->
            <v-window-item value="consultant">
              <v-card-title class="d-flex align-center justify-space-between py-3 px-4 bg-grey-lighten-4">
                <span class="text-subtitle-1 font-weight-bold">顧問師 / 講師獎金</span>
                <div class="d-flex ga-2 align-center">
                  <v-btn
                    v-if="selectedConsultantIds.length > 0"
                    color="success" variant="flat" size="small" prepend-icon="check_circle"
                    @click="batchMarkStatus(selectedConsultantIds, 'PAID', 'consultant')"
                  >批次標記為已發放 ({{ selectedConsultantIds.length }})</v-btn>
                </div>
              </v-card-title>
              <v-divider></v-divider>
              <v-data-table
                :headers="feeDetailConsultantHeaders"
                :items="consultantFeeItems"
                :loading="feeLoading"
                v-model="selectedConsultantIds"
                show-select item-value="id"
                class="elevation-0" no-data-text="查無顧問師/講師明細"
              >
                <template #item.feeCategory="{ item }">
                  <v-chip size="small" :color="item.feeCategory === 'CONSULTANT' ? 'teal' : 'cyan'" variant="tonal">
                    {{ item.feeCategory === 'CONSULTANT' ? '顧問師' : '講師' }}
                  </v-chip>
                </template>
                <template #item.productRevenue="{ item }"><span>{{ formatNumber(item.productRevenue) }}</span></template>
                <template #item.adminFeeRate="{ item }"><span>{{ formatNumber(item.adminFeeRate) }}</span></template>
                <template #item.adminFeeAmount="{ item }"><span>{{ formatNumber(item.adminFeeAmount) }}</span></template>
                <template #item.netProductProfit="{ item }"><span>{{ formatNumber(item.netProductProfit) }}</span></template>
                <template #item.dfyc="{ item }"><span>{{ formatNumber(item.dfyc) }}</span></template>
                <template #item.percentage="{ item }"><span>{{ formatNumber(item.percentage) }}%</span></template>
                <template #item.rawAmount="{ item }"><span class="font-weight-medium">{{ formatNumber(item.rawAmount) }}</span></template>
                <template #item.taxAmount="{ item }"><span class="text-red-darken-2">-{{ formatNumber(item.taxAmount) }}</span></template>
                <template #item.premiumAmount="{ item }"><span class="text-orange-darken-2">-{{ formatNumber(item.premiumAmount) }}</span></template>
                <template #item.amount="{ item }"><span class="font-weight-bold text-success">{{ formatNumber(item.amount) }}</span></template>
                <template #item.payoutStatus="{ item }">
                  <v-chip size="small" :color="statusColor(item.payoutStatus)" variant="flat">{{ statusLabel(item.payoutStatus) }}</v-chip>
                </template>
                <template #item.actions="{ item }">
                  <v-btn size="small" variant="tonal" color="success" class="mr-2 font-weight-bold" @click="markSingleStatus(item, 'PAID')">標記發放</v-btn>
                  <v-btn size="small" variant="tonal" color="grey" class="font-weight-bold" @click="markSingleStatus(item, 'EXCLUDED')">歷史已付</v-btn>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- 乙方費用 -->
            <v-window-item value="partner">
              <v-card-title class="d-flex align-center justify-space-between py-3 px-4 bg-grey-lighten-4">
                <span class="text-subtitle-1 font-weight-bold">乙方費用</span>
                <div class="d-flex ga-2 align-center">
                  <v-btn
                    v-if="selectedPartnerIds.length > 0"
                    color="success" variant="flat" size="small" prepend-icon="check_circle"
                    @click="batchMarkStatus(selectedPartnerIds, 'PAID', 'partner')"
                  >批次標記為已發放 ({{ selectedPartnerIds.length }})</v-btn>
                </div>
              </v-card-title>
              <v-divider></v-divider>
              <v-data-table
                :headers="feeDetailPartnerHeaders"
                :items="partnerFeeItems"
                :loading="feeLoading"
                v-model="selectedPartnerIds"
                show-select item-value="id"
                class="elevation-0" no-data-text="查無乙方費用明細"
              >
                <template #item.productRevenue="{ item }"><span>{{ formatNumber(item.productRevenue) }}</span></template>
                <template #item.adminFeeRate="{ item }"><span>{{ formatNumber(item.adminFeeRate) }}</span></template>
                <template #item.adminFeeAmount="{ item }"><span>{{ formatNumber(item.adminFeeAmount) }}</span></template>
                <template #item.netProductProfit="{ item }"><span>{{ formatNumber(item.netProductProfit) }}</span></template>
                <template #item.percentage="{ item }"><span>{{ item.shareDisplay || `${formatNumber(item.percentage)}%` }}</span></template>
                <template #item.rawAmount="{ item }"><span class="font-weight-medium">{{ formatNumber(item.rawAmount) }}</span></template>
                <template #item.amount="{ item }"><span class="font-weight-bold text-success">{{ formatNumber(item.amount) }}</span></template>
                <template #item.payoutStatus="{ item }">
                  <v-chip size="small" :color="statusColor(item.payoutStatus)" variant="flat">{{ statusLabel(item.payoutStatus) }}</v-chip>
                </template>
                <template #item.externalMember="{ item }">
                  <div v-if="item.externalMember">
                    <div class="text-caption font-weight-bold">統編: {{ item.externalMember.taxId }}</div>
                    <div class="text-caption text-grey-darken-1">{{ item.externalMember.bankCode }} {{ item.externalMember.bankAccount }}</div>
                  </div>
                  <span v-else class="text-caption text-grey">無銀行資料</span>
                </template>
                <template #item.actions="{ item }">
                  <v-btn size="small" variant="tonal" color="success" class="mr-2 font-weight-bold" @click="markSingleStatus(item, 'PAID')">標記發放</v-btn>
                  <v-btn size="small" variant="tonal" color="grey" class="font-weight-bold" @click="markSingleStatus(item, 'EXCLUDED')">歷史已付</v-btn>
                </template>
              </v-data-table>
            </v-window-item>

            <v-window-item value="payout" v-if="status.isClosed">
              <v-card-title class="d-flex align-center justify-space-between py-3 px-4 bg-grey-lighten-4">
                <span class="text-subtitle-1 font-weight-bold">實際佣金發放與飼料扣除紀錄</span>
                <div class="d-flex ga-2">
                  <v-btn
                    color="primary"
                    variant="outlined"
                    size="small"
                    prepend-icon="visibility"
                    @click="previewClosingPayment"
                  >
                    預覽報表
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    size="small"
                    prepend-icon="download"
                    @click="exportClosingPayment"
                  >
                    下載實際發放金額總表
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    size="small"
                    prepend-icon="download"
                    @click="downloadZip"
                  >
                    下載個人佣金單 (ZIP)
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider></v-divider>

              <v-data-table
                :headers="payoutHeaders"
                :items="payoutItems"
                :loading="loading"
                class="elevation-0"
                no-data-text="本月無點數 >= 500 以上發放之扣除紀錄"
              >
                <template #item.balance="{ item }">
                  <span class="font-weight-bold">{{ formatNumber(item.balance) }}</span>
                </template>
                <template #item.tax="{ item }">
                  <span class="text-red-darken-2">{{ formatNumber(item.tax) }}</span>
                </template>
                <template #item.supplementary="{ item }">
                  <span>{{ formatNumber(item.supplementary) }}</span>
                </template>
                <template #item.netAmount="{ item }">
                  <span class="font-weight-bold text-success">{{ formatNumber(item.netAmount) }}</span>
                </template>
              </v-data-table>
            </v-window-item>

            <v-window-item value="expectedPayout" v-if="status.isSettled && !status.isClosed">
              <v-card-title class="d-flex align-center justify-space-between py-3 px-4 bg-grey-lighten-4">
                <span class="text-subtitle-1 font-weight-bold">預計發放與扣除預覽 (草稿)</span>
                <div class="d-flex ga-2">
                  <v-btn
                    color="primary"
                    variant="outlined"
                    size="small"
                    prepend-icon="visibility"
                    @click="previewExpectedClosingPayment"
                  >
                    預覽報表
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    size="small"
                    prepend-icon="download"
                    @click="exportExpectedClosingPayment"
                  >
                    下載預計發放總表
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider></v-divider>

              <v-data-table
                :headers="expectedPayoutHeaders"
                :items="expectedPayoutItems"
                :loading="loading"
                class="elevation-0"
                no-data-text="本月預計無點數合計 >= 500 以上發放之扣除紀錄"
              >
                <template #item.currentBalance="{ item }">
                  <span>{{ formatNumber(item.currentBalance) }}</span>
                </template>
                <template #item.newCommission="{ item }">
                  <span>{{ formatNumber(item.newCommission) }}</span>
                </template>
                <template #item.balance="{ item }">
                  <span class="font-weight-bold">{{ formatNumber(item.balance) }}</span>
                </template>
                <template #item.tax="{ item }">
                  <span class="text-red-darken-2">{{ formatNumber(item.tax) }}</span>
                </template>
                <template #item.supplementary="{ item }">
                  <span>{{ formatNumber(item.supplementary) }}</span>
                </template>
                <template #item.netAmount="{ item }">
                  <span class="font-weight-bold text-success">{{ formatNumber(item.netAmount) }}</span>
                </template>
              </v-data-table>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- 當月尚未結算且無資料 -->
    <v-row v-if="!status.isSettled && !loading">
      <v-col cols="12" class="text-center py-12">
        <v-icon size="64" color="grey-lighten-1" class="mb-3">info</v-icon>
        <h3 class="text-h6 text-grey-darken-2">該月份尚未執行自動結算</h3>
        <p class="text-body-2 text-grey-darken-1 mb-4">系統會於每月 5 號 00:00 自動執行結算。若您需要，可以點擊上方「手動執行試算結算」按鈕提前結算。</p>
      </v-col>
    </v-row>

    <!-- 關帳發放 Dialog -->
    <v-dialog v-model="closeDialog" max-width="500">
      <v-card class="pa-2">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center ga-2">
          <v-icon color="error">warning</v-icon>
          <span>手動執行關帳與發放確認</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-4">
          <p class="text-body-2 mb-4 text-grey-darken-3">
            您即將對 <strong>{{ yearMonth }}</strong> 月份進行關帳。此操作將執行以下動作：
          </p>
          <v-alert color="error" variant="tonal" class="mb-4 text-caption" density="compact">
            ⚠️ 關帳發放為不可逆操作！一旦關帳，該月份的分潤資料將被鎖定，且飼料將正式存入會員帳戶。
          </v-alert>

          <div class="text-subtitle-2 font-weight-bold mb-2">請選擇發放與付款方式：</div>
          <v-radio-group v-model="paymentMethod" inline>
            <v-radio label="手動發放 (扣除點數)" value="Manual" color="primary"></v-radio>
            <v-radio label="玉山銀行 API 轉帳" value="Esun" color="primary"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions class="d-flex justify-end ga-2">
          <v-btn color="grey-darken-1" variant="outlined" @click="closeDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="actionLoading" @click="executeClosing">確認關帳</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Excel 預覽 Dialog -->
    <v-dialog v-model="previewDialog" max-width="1200" scrollable>
      <v-card class="pa-2 h-100">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary">table_chart</v-icon>
            <span>Excel 預覽 - {{ previewFileName }}</span>
          </div>
          <v-btn icon="close" variant="text" @click="previewDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0" style="height: 70vh; overflow: auto; position: relative;">
          <div v-if="previewLoading" class="d-flex flex-column align-center justify-center h-100 py-12" style="position: absolute; width: 100%; height: 100%; z-index: 10; background: rgba(255,255,255,0.8);">
            <v-progress-circular indeterminate color="primary" size="48" class="mb-3"></v-progress-circular>
            <span class="text-body-1 text-grey-darken-2">正在載入並解析 Excel 報表，請稍候...</span>
          </div>

          <!-- 錯誤提示 -->
          <div v-if="previewError" class="d-flex flex-column align-center justify-center h-100 py-12 px-6 text-center" style="min-height: 400px;">
            <v-icon size="64" color="warning" class="mb-4">warning</v-icon>
            <span class="text-h6 font-weight-bold text-grey-darken-3 mb-2">{{ previewErrorMessage }}</span>
            <span class="text-body-2 text-grey-darken-1">您可以直接點擊下方「下載此 Excel」按鈕，下載至您的電腦使用 Microsoft Excel 或其它工具開啟。</span>
          </div>

          <!-- vue-office-excel 元件 -->
          <vue-office-excel
            v-if="previewExcelData && !previewError"
            :src="previewExcelData"
            style="height: 100%; min-height: 500px;"
            @rendered="onPreviewRendered"
            @error="onPreviewError"
          />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="d-flex justify-end ga-2">
          <v-btn color="grey-darken-1" variant="outlined" @click="previewDialog = false">關閉</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="download" @click="downloadPreviewFile">下載此 Excel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, watch, computed, onMounted, onErrorCaptured } from 'vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/excel/lib/index.css'
import JSZip from 'jszip'
import ApexCharts from 'vue3-apexcharts'

const dialog = useDialogStore()

// Helper: 修復 ClosedXML 產生的 OpenXML 絕對關係路徑與命名空間前綴，以支援前端 exceljs / @vue-office/excel 解析
async function cleanExcelRelationships(arrayBuffer) {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer)
    let modified = false

    // 1. 清理關係路徑
    const relsFiles = []
    zip.forEach((relativePath, file) => {
      if (relativePath.endsWith('.rels')) {
        relsFiles.push(file)
      }
    })

    for (const file of relsFiles) {
      const content = await file.async('text')
      
      const parts = file.name.split('/')
      const relsIndex = parts.indexOf('_rels')
      if (relsIndex === -1) continue
      
      const prefixParts = parts.slice(0, relsIndex) // e.g. ["xl"]
      
      // 將關係 Target="/xl/..." 等絕對路徑轉換成基於目前 .rels 所在層級的相對路徑
      const newContent = content.replace(/Target="\/([^"]+)"/g, (match, targetPath) => {
        const targetParts = targetPath.split('/')
        
        let commonCount = 0
        while (
          commonCount < prefixParts.length &&
          commonCount < targetParts.length &&
          prefixParts[commonCount] === targetParts[commonCount]
        ) {
          commonCount++
        }
        
        const upCount = prefixParts.length - commonCount
        const downParts = targetParts.slice(commonCount)
        
        let relPath = ''
        for (let i = 0; i < upCount; i++) {
          relPath += '../'
        }
        relPath += downParts.join('/')
        
        return `Target="${relPath}"`
      })

      if (content !== newContent) {
        zip.file(file.name, newContent)
        modified = true
      }
    }

    // 2. 清理命名空間前綴 (x:, ap:, cp:) 避免 exceljs 解析失敗
    const xmlFiles = []
    zip.forEach((relativePath, file) => {
      if (relativePath.endsWith('.xml')) {
        xmlFiles.push(file)
      }
    })

    for (const file of xmlFiles) {
      let content = await file.async('text')
      let changed = false

      if (content.includes('<x:') || content.includes('</x:')) {
        content = content.replace(/<x:(\w+)/g, '<$1')
        content = content.replace(/<\/x:(\w+)/g, '</$1')
        content = content.replace(/xmlns:x="http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main"/g, 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"')
        content = content.replace(/xmlns:x="http:\/\/schemas\.microsoft\.com\/office\/excel\/2006\/main"/g, 'xmlns="http://schemas.microsoft.com/office/excel/2006/main"')
        changed = true
      }

      if (content.includes('<ap:') || content.includes('</ap:')) {
        content = content.replace(/<ap:(\w+)/g, '<$1')
        content = content.replace(/<\/ap:(\w+)/g, '</$1')
        content = content.replace(/xmlns:ap="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/extended-properties"/g, 'xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"')
        changed = true
      }

      if (content.includes('<cp:') || content.includes('</cp:')) {
        content = content.replace(/<cp:(\w+)/g, '<$1')
        content = content.replace(/<\/cp:(\w+)/g, '</$1')
        content = content.replace(/xmlns:cp="http:\/\/schemas\.openxmlformats\.org\/package\/2006\/metadata\/core-properties"/g, 'xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"')
        changed = true
      }

      if (changed) {
        zip.file(file.name, content)
        modified = true
      }
    }

    if (modified) {
      return await zip.generateAsync({ type: 'arraybuffer' })
    }
  } catch (e) {
    console.error('Failed to pre-process Excel relations and namespaces on frontend:', e)
  }
  return arrayBuffer
}



// Excel 預覽狀態
const previewDialog = ref(false)
const previewLoading = ref(false)
const previewFileName = ref('')
const previewBlob = ref(null)
const previewExcelData = ref(null)
const previewError = ref(false)
const previewErrorMessage = ref('')

watch(previewDialog, (val) => {
  if (!val) {
    if (previewExcelData.value && typeof previewExcelData.value === 'string' && previewExcelData.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewExcelData.value)
    }
    previewBlob.value = null
    previewExcelData.value = null
    previewError.value = false
    previewErrorMessage.value = ''
  }
})

async function previewExcel(endpoint, params, fileName) {
  previewFileName.value = fileName
  previewLoading.value = true
  previewDialog.value = true
  previewError.value = false
  previewErrorMessage.value = ''
  try {
    const res = await api.get(endpoint, {
      params,
      responseType: 'arraybuffer'
    })
    
    // Check if the response is JSON error wrapped in arraybuffer
    const contentType = res.headers['content-type'] || res.headers['Content-Type'] || ''
    if (contentType.includes('application/json')) {
      const text = new TextDecoder().decode(res.data)
      console.error('API returned JSON error instead of Excel:', text)
      try {
        const errObj = JSON.parse(text)
        dialog.showError('預覽失敗', errObj.message || errObj.Message || '伺服器傳回錯誤')
      } catch (e) {
        dialog.showError('預覽失敗', text)
      }
      previewDialog.value = false
      previewLoading.value = false
      return
    }

    if (contentType.includes('text/html')) {
      const text = new TextDecoder().decode(res.data)
      console.error('API returned HTML error page instead of Excel:', text)
      dialog.showError('預覽失敗', '伺服器內部錯誤 (500)')
      previewDialog.value = false
      previewLoading.value = false
      return
    }

    if (!res.data || res.data.byteLength === 0) {
      dialog.showError('預覽失敗', '伺服器傳回了空的檔案')
      previewDialog.value = false
      previewLoading.value = false
      return
    }

    // Store ArrayBuffer for preview (cleaned to support frontend preview libraries)
    previewExcelData.value = await cleanExcelRelationships(res.data)
    // Create Blob from ArrayBuffer for download (keep original pristine ClosedXML structure)
    previewBlob.value = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  } catch (err) {
    console.error('Failed to load excel for preview:', err)
    dialog.showError('預覽失敗', err.response?.data?.message || '載入報表資料失敗')
    previewDialog.value = false
    previewLoading.value = false
  }
}

function onPreviewRendered() {
  previewLoading.value = false
  console.log('Excel preview rendered successfully.')
}

function handlePreviewError(err) {
  previewLoading.value = false
  previewError.value = true
  previewErrorMessage.value = '線上預覽失敗：此報表結構或自訂樣式暫不支援預覽。'
  console.error('Excel preview error:', err)
}

function onPreviewError(err) {
  handlePreviewError(err)
}

onErrorCaptured((err, instance, info) => {
  if (previewDialog.value) {
    handlePreviewError(err)
    return false // Stop error propagation
  }
})

function downloadPreviewFile() {
  if (previewBlob.value && previewFileName.value) {
    downloadBlob(previewBlob.value, previewFileName.value)
  }
}

async function previewMonthlyAllInOne() {
  await previewExcel(
    '/Commission/export-monthly-all-in-one',
    { yearMonth: yearMonth.value },
    `月分潤整合報表_${yearMonth.value}.xlsx`
  )
}

async function previewClosingPayment() {
  await previewExcel(
    '/Commission/export-closing-payment-new',
    { yearMonth: yearMonth.value },
    `實際發放金額總表_${yearMonth.value}.xlsx`
  )
}

async function previewExpectedClosingPayment() {
  await previewExcel(
    '/Commission/export-expected-closing-payment',
    { yearMonth: yearMonth.value },
    `預計發放金額總表_${yearMonth.value}.xlsx`
  )
}

async function exportExpectedClosingPayment() {
  try {
    dialog.showLoading()
    const res = await api.get('/Commission/export-expected-closing-payment', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob'
    })
    downloadBlob(res.data, `預計佣金發放薪資總表_${yearMonth.value}.xlsx`)
  } catch (err) {
    dialog.showError('下載失敗', '無法下載預計發放薪資總表')
  } finally {
    dialog.hideLoading()
  }
}

const yearMonth = ref('')
const loading = ref(false)
const actionLoading = ref(false)
const closeDialog = ref(false)
const paymentMethod = ref('Manual')

// 儀表板與圓餅圖狀態
const summaryLoading = ref(false)
const summaryData = ref({
  totalRevenue: 0,
  totalMfycPayout: 0,
  totalUfycMgmtPayout: 0,
  totalConsultantPayout: 0,
  totalLecturerPayout: 0,
  totalPartnerPayout: 0,
  totalTaxDeduction: 0,
  totalPremiumDeduction: 0,
  totalNetPayout: 0
})

const totalAgentCommission = computed(() => {
  return rawSettlementData.value.reduce((acc, curr) => acc + (curr.amount || 0), 0)
})

const totalMgmtFee = computed(() => {
  return (summaryData.value.totalMfycPayout || 0) + (summaryData.value.totalUfycMgmtPayout || 0)
})

const totalConsultantFee = computed(() => {
  return (summaryData.value.totalConsultantPayout || 0) + (summaryData.value.totalLecturerPayout || 0)
})

const totalPartnerFee = computed(() => {
  return summaryData.value.totalPartnerPayout || 0
})

const totalPayout = computed(() => {
  return totalAgentCommission.value + totalMgmtFee.value + totalConsultantFee.value + totalPartnerFee.value
})

const totalNetProfit = computed(() => {
  return (summaryData.value.totalRevenue || 0) - totalPayout.value
})

const percentOfRevenue = (amount) => {
  const rev = summaryData.value.totalRevenue || 0
  if (rev <= 0) return 0
  return parseFloat(((amount / rev) * 100).toFixed(2))
}

const agentPercentage = computed(() => percentOfRevenue(totalAgentCommission.value))
const mgmtPercentage = computed(() => percentOfRevenue(totalMgmtFee.value))
const consultantPercentage = computed(() => percentOfRevenue(totalConsultantFee.value))
const partnerPercentage = computed(() => percentOfRevenue(totalPartnerFee.value))
const netProfitPercentage = computed(() => percentOfRevenue(totalNetProfit.value))

// 圓餅圖/甜甜圈圖資料
const chartSeries = computed(() => {
  const agent = Math.max(0, totalAgentCommission.value)
  const mgmt = Math.max(0, totalMgmtFee.value)
  const consultant = Math.max(0, totalConsultantFee.value)
  const partner = Math.max(0, totalPartnerFee.value)
  const netProfit = Math.max(0, totalNetProfit.value)
  return [agent, mgmt, consultant, partner, netProfit]
})

const chartLabels = ['代理商分潤', '管理費', '顧問/講師費', '乙方費用', '公司保留淨利']
const chartColors = ['#4f46e5', '#0d9488', '#f97316', '#db2777', '#16a34a']

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'donut',
    },
    colors: chartColors,
    labels: chartLabels,
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '13px',
      fontFamily: 'inherit',
      markers: {
        radius: 12,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${formatNumber(val)} 元`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'inherit',
              color: '#666',
              offsetY: -5,
            },
            value: {
              show: true,
              fontSize: '18px',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: '#111',
              offsetY: 5,
              formatter: (val) => formatNumber(val),
            },
            total: {
              show: true,
              label: '總營收',
              fontSize: '14px',
              fontFamily: 'inherit',
              fontWeight: 500,
              color: '#666',
              formatter: () => formatNumber(summaryData.value.totalRevenue || 0),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  }
})

// 詳情分頁與開發環境判斷
const detailsTab = ref('settlement')
const resetLoading = ref(false)

// 自訂月份選擇器狀態
const monthMenu = ref(false)
const pickerYear = ref(new Date().getFullYear())
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const maxYear = computed(() => {
  if (!maxMonth.value) return new Date().getFullYear()
  return parseInt(maxMonth.value.split('-')[0])
})

const maxMonthNum = computed(() => {
  if (!maxMonth.value) return new Date().getMonth() + 1
  return parseInt(maxMonth.value.split('-')[1])
})

function isMonthDisabled(idx) {
  const monthNum = idx + 1
  if (pickerYear.value > maxYear.value) return true
  if (pickerYear.value === maxYear.value && monthNum > maxMonthNum.value) return true
  return false
}

function isSelectedMonth(idx) {
  if (!yearMonth.value) return false
  const [y, m] = yearMonth.value.split('-')
  return parseInt(y) === pickerYear.value && parseInt(m) === (idx + 1)
}

function selectMonth(idx) {
  const monthStr = (idx + 1).toString().padStart(2, '0')
  yearMonth.value = `${pickerYear.value}-${monthStr}`
  monthMenu.value = false
}
// 月份狀態
const status = ref({
  isSettled: false,
  settledAt: null,
  isClosed: false,
  closedAt: null,
  closedBy: null
})

// 報表明細
const rawSettlementData = ref([])
const payoutItems = ref([])
const expectedPayoutItems = ref([])



// 非代理商費用明細 (Phase 2)
const mgmtFeeItems = ref([])
const consultantFeeItems = ref([])
const partnerFeeItems = ref([])
const feeLoading = ref(false)
const selectedMgmtIds = ref([])
const selectedConsultantIds = ref([])
const selectedPartnerIds = ref([])

// 計算最大可選月份為上個月
const maxMonth = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // getMonth() 不加 1 即為上個月
  const lastMonthDate = new Date(year, month, 1)
  return lastMonthDate.toISOString().slice(0, 7)
})

// 結算預覽表頭
const settlementHeaders = [
  { title: '姓名', key: 'name', sortable: true },
  { title: '代理位階', key: 'grade' },
  { title: '銷售獎金', key: 'sales' },
  { title: '輔導獎金', key: 'gap' },
  { title: '同階獎金', key: 'peer' },
  { title: '超越獎金', key: 'super' },
  { title: '經營獎金', key: 'management' },
  { title: '發放飼料', key: 'amount', align: 'end' }
]

// 稅率設定 % 數
const taxRatePercent = ref(5)

// 非代理商費用明細表頭 (管理費 / UFYC管理人員)
const feeDetailHeaders = computed(() => [
  { title: '類別', key: 'feeCategory', width: 140 },
  { title: '職稱', key: 'jobTitle', width: 130 },
  { title: '姓名', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: '基數', key: 'baseAmount', align: 'end' },
  { title: '比例 (%)', key: 'percentage', align: 'end' },
  { title: '應發總額', key: 'rawAmount', align: 'end' },
  { title: `所得稅 (${taxRatePercent.value}%)`, key: 'taxAmount', align: 'end' },
  { title: '補充保費 (2.11%)', key: 'premiumAmount', align: 'end' },
  { title: '實發金額', key: 'amount', align: 'end' },
  { title: '發放狀態', key: 'payoutStatus', width: 130 },
  { title: '操作', key: 'actions', sortable: false, width: 200 }
])

// 顧問師/講師獎金表頭
const feeDetailConsultantHeaders = computed(() => [
  { title: '類別', key: 'feeCategory', width: 100 },
  { title: '姓名', key: 'name' },
  { title: '訂單編號', key: 'orderNo' },
  { title: '商品', key: 'productName' },
  { title: '商品收入', key: 'productRevenue', align: 'end' },
  { title: '行政費率', key: 'adminFeeRate', align: 'end' },
  { title: '行政費用', key: 'adminFeeAmount', align: 'end' },
  { title: '商品淨利', key: 'netProductProfit', align: 'end' },
  { title: 'DFYC', key: 'dfyc', align: 'end' },
  { title: '分潤比 (%)', key: 'percentage', align: 'end' },
  { title: '應發總額', key: 'rawAmount', align: 'end' },
  { title: `所得稅 (${taxRatePercent.value}%)`, key: 'taxAmount', align: 'end' },
  { title: '補充保費 (2.11%)', key: 'premiumAmount', align: 'end' },
  { title: '實發金額', key: 'amount', align: 'end' },
  { title: '發放狀態', key: 'payoutStatus', width: 130 },
  { title: '操作', key: 'actions', sortable: false, width: 200 }
])

// 乙方費用表頭
const feeDetailPartnerHeaders = computed(() => [
  { title: '乙方名稱', key: 'name' },
  { title: '銀行帳戶資訊', key: 'externalMember' },
  { title: '訂單編號', key: 'orderNo' },
  { title: '商品', key: 'productName' },
  { title: '商品收入', key: 'productRevenue', align: 'end' },
  { title: '行政費率', key: 'adminFeeRate', align: 'end' },
  { title: '行政費用', key: 'adminFeeAmount', align: 'end' },
  { title: '商品淨利', key: 'netProductProfit', align: 'end' },
  { title: '分潤比 (%)', key: 'percentage', align: 'end' },
  { title: '應發總額', key: 'rawAmount', align: 'end' },
  { title: '實發金額', key: 'amount', align: 'end' },
  { title: '發放狀態', key: 'payoutStatus', width: 130 },
  { title: '操作', key: 'actions', sortable: false, width: 200 }
])

// 實際發放表頭
const payoutHeaders = computed(() => [
  { title: '姓名', key: 'name' },
  { title: '創業中心名稱', key: 'unitName' },
  { title: '身份證號', key: 'idNumber' },
  { title: '銀行代碼', key: 'bankCode' },
  { title: '銀行帳號', key: 'bankAccount' },
  { title: '扣除飼料 (點數)', key: 'balance', align: 'end' },
  { title: `稅額 (${taxRatePercent.value}%)`, key: 'tax', align: 'end' },
  { title: '補充保費 (2.11%)', key: 'supplementary', align: 'end' },
  { title: '實發金額 (NTD)', key: 'netAmount', align: 'end' }
])

// 預計發放表頭
const expectedPayoutHeaders = computed(() => [
  { title: '姓名', key: 'name' },
  { title: '創業中心名稱', key: 'unitName' },
  { title: '身份證號', key: 'idNumber' },
  { title: '銀行帳號', key: 'bankAccount' },
  { title: '銀行代碼', key: 'bankCode' },
  { title: '當前飼料', key: 'currentBalance', align: 'end' },
  { title: '新增分潤', key: 'newCommission', align: 'end' },
  { title: '預計合計飼料', key: 'balance', align: 'end' },
  { title: `預估稅額 (${taxRatePercent.value}%)`, key: 'tax', align: 'end' },
  { title: '預估二代健保 (2.11%)', key: 'supplementary', align: 'end' },
  { title: '預計實發金額 (NTD)', key: 'netAmount', align: 'end' }
])

// 對原資料進行 GroupBy 姓名展示
const settlementItems = computed(() => {
  const grouped = {}
  rawSettlementData.value.forEach((item) => {
    const key = item.accountGuid
    if (!grouped[key]) {
      grouped[key] = {
        accountGuid: item.accountGuid,
        name: item.name,
        grade: item.grade,
        sales: 0,
        gap: 0,
        peer: 0,
        super: 0,
        management: 0,
        amount: 0
      }
    }
    grouped[key].sales += item.sales || 0
    grouped[key].gap += item.gap || 0
    grouped[key].peer += item.peer || 0
    grouped[key].super += item.super || 0
    grouped[key].management += item.management || 0
    grouped[key].amount += item.amount || 0
  })
  return Object.values(grouped)
})

// 載入資料
async function fetchData() {
  if (!yearMonth.value) return
  loading.value = true
  try {
    // 1. 取得狀態
    const statusRes = await api.get('/Commission/monthly-status', {
      params: { yearMonth: yearMonth.value }
    })
    status.value = statusRes.data

    // 2. 依據狀態載入對應表格
    if (status.value.isSettled) {
      const settleRes = await api.get('/Commission', {
        params: { YearMonth: yearMonth.value }
      })
      rawSettlementData.value = settleRes.data.commissions || []
      await fetchSummaryData()
    } else {
      rawSettlementData.value = []
      resetSummaryData()
    }

    if (status.value.isClosed) {
      const payoutRes = await api.get('/Commission/closing-payment-details', {
        params: { yearMonth: yearMonth.value }
      })
      payoutItems.value = payoutRes.data || []
      expectedPayoutItems.value = []
      detailsTab.value = 'payout'
    } else {
      payoutItems.value = []
      if (status.value.isSettled) {
        const expectedPayoutRes = await api.get('/Commission/expected-closing-payment-details', {
          params: { yearMonth: yearMonth.value }
        })
        expectedPayoutItems.value = expectedPayoutRes.data || []
        detailsTab.value = 'expectedPayout'
      } else {
        expectedPayoutItems.value = []
        detailsTab.value = 'settlement'
      }
    }

    // 3. 載入非代理商費用明細 (MonthlyFeeDetail)
    if (status.value.isSettled) {
      await fetchFeeDetails()
    } else {
      mgmtFeeItems.value = []
      consultantFeeItems.value = []
      partnerFeeItems.value = []
    }
  } catch (err) {
    dialog.showError('載入失敗', err.response?.data?.message || '讀取月份資料時出錯。')
  } finally {
    loading.value = false
  }
}

// 載入每月費用彙總
async function fetchSummaryData() {
  summaryLoading.value = true
  try {
    const res = await api.get('/Commission/monthly-fee-summary', {
      params: { yearMonth: yearMonth.value }
    })
    summaryData.value = res.data || {
      totalRevenue: 0,
      totalMfycPayout: 0,
      totalUfycMgmtPayout: 0,
      totalConsultantPayout: 0,
      totalLecturerPayout: 0,
      totalPartnerPayout: 0,
      totalTaxDeduction: 0,
      totalPremiumDeduction: 0,
      totalNetPayout: 0
    }
  } catch (err) {
    console.warn('載入費用彙總失敗:', err)
  } finally {
    summaryLoading.value = false
  }
}

function resetSummaryData() {
  summaryData.value = {
    totalRevenue: 0,
    totalMfycPayout: 0,
    totalUfycMgmtPayout: 0,
    totalConsultantPayout: 0,
    totalLecturerPayout: 0,
    totalPartnerPayout: 0,
    totalTaxDeduction: 0,
    totalPremiumDeduction: 0,
    totalNetPayout: 0
  }
}

// 載入非代理商費用明細
async function fetchFeeDetails() {
  feeLoading.value = true
  try {
    const res = await api.get('/Commission/monthly-fee-details', {
      params: { yearMonth: yearMonth.value }
    })
    const all = res.data || []
    mgmtFeeItems.value = all.filter(d => d.feeCategory === 'MFYC' || d.feeCategory === 'UFYC_MGMT')
    consultantFeeItems.value = all.filter(d => d.feeCategory === 'CONSULTANT' || d.feeCategory === 'LECTURER')
    partnerFeeItems.value = all.filter(d => d.feeCategory === 'PARTNER')
  } catch (err) {
    console.warn('載入費用明細失敗:', err)
  } finally {
    feeLoading.value = false
  }
}

// 手動觸發結算
async function triggerManualSettle() {
  const confirm = await dialog.askConfirm({
    title: '手動結算',
    message: `確認要開始試算並結算 ${yearMonth.value} 月份的分潤嗎？`
  })
  if (!confirm) return

  actionLoading.value = true
  try {
    await api.post('/Commission/settle-monthly-draft', {
      YearMonth: yearMonth.value
    })
    dialog.showSuccess('結算成功', '分潤試算已完成，您可以下載報表核對。')
    await fetchData()
  } catch (err) {
    dialog.showError('結算失敗', err.response?.data?.message || '執行手動結算時出錯。')
  } finally {
    actionLoading.value = false
  }
}

// 重置並重算月份（清除佣金結算結果，供重算用；保留 admin 手動加扣款紀錄）
// 正式環境亦可使用，因此採「雙重確認」避免誤點。
async function triggerResetMonth() {
  // 第一層確認：說明用途
  const first = await dialog.askConfirm({
    title: '重置並重算此月份',
    message: `即將清除 ${yearMonth.value} 月份的「佣金結算結果」（結算明細、彙總、關帳狀態與其發放的飼料餘額），以便用修正後的算法重新結算。\n\n會保留：admin 手動加扣款紀錄不受影響。\n\n要繼續嗎？`
  })
  if (!first) return

  // 第二層確認：不可逆紅色警告
  const second = await dialog.askConfirm({
    title: '⚠️ 最終確認（不可逆）',
    message: `這是正式環境的不可逆操作，將實際還原 ${yearMonth.value} 月份已發放的飼料並刪除該月結算紀錄。\n請確認已下載/核對過原始報表後再執行。\n\n確定要重置 ${yearMonth.value} 嗎？`,
    isDelete: true
  })
  if (!second) return

  resetLoading.value = true
  try {
    const res = await api.post('/Commission/test-reset-month', {
      YearMonth: yearMonth.value
    })
    dialog.showSuccess('重置成功', res.data.message || `${yearMonth.value} 已回復至未結算狀態，可重新執行結算。`)
    await fetchData()
  } catch (err) {
    dialog.showError('重置失敗', err.response?.data?.message || '執行重置時出錯。')
  } finally {
    resetLoading.value = false
  }
}

// 開啟關帳 Dialog
function openCloseDialog() {
  paymentMethod.value = 'Manual'
  closeDialog.value = true
}

// 辞色輔助 Helper
function statusColor(status) {
  if (status === 'PAID') return 'success'
  if (status === 'EXCLUDED') return 'grey'
  return 'warning'
}
function statusLabel(status) {
  if (status === 'PAID') return '已發放'
  if (status === 'EXCLUDED') return '歷史已付'
  return '未發放'
}

// 單筆更新發放狀態
async function markSingleStatus(item, status) {
  const label = status === 'PAID' ? '已發放' : '歷史已手工發放 (不重複出金)'
  const confirm = await dialog.askConfirm({
    title: `確認標記`,
    message: `確認將「${item.name}」的費用標記為「${label}」？`
  })
  if (!confirm) return

  try {
    await api.post('/Commission/update-fee-payout-status', {
      id: item.id,
      status,
      method: 'MANUAL',
      note: `Admin 手動標記 ${new Date().toLocaleString('zh-TW')}`
    })
    dialog.showSuccess('更新成功', `已標記為 ${label}`)
    await fetchFeeDetails()
  } catch (err) {
    dialog.showError('更新失敗', err.response?.data?.message || '更新發放狀態失敗')
  }
}

// 批次更新發放狀態
async function batchMarkStatus(ids, status, group) {
  const label = status === 'PAID' ? '已發放' : '歷史已付'
  const confirm = await dialog.askConfirm({
    title: '批次標記',
    message: `確認將選取的 ${ids.length} 筆費用標記為「${label}」？`
  })
  if (!confirm) return

  try {
    await api.post('/Commission/batch-update-fee-payout-status', {
      ids,
      status,
      method: 'MANUAL',
      note: `Admin 批次標記 ${new Date().toLocaleString('zh-TW')}`
    })
    dialog.showSuccess('批次更新成功', `共 ${ids.length} 筆已標記為 ${label}`)
    if (group === 'mgmt') selectedMgmtIds.value = []
    else if (group === 'consultant') selectedConsultantIds.value = []
    else if (group === 'partner') selectedPartnerIds.value = []
    await fetchFeeDetails()
  } catch (err) {
    dialog.showError('批次更新失敗', err.response?.data?.message || '批次更新失敗')
  }
}

async function executeClosing() {
  closeDialog.value = false
  actionLoading.value = true
  try {
    const res = await api.post('/Commission/close-monthly-new', {
      YearMonth: yearMonth.value,
      PaymentMethod: paymentMethod.value
    })
    dialog.showSuccess('關帳完成', res.data.message || '關帳發佣程序已成功執行！')
    await fetchData()
  } catch (err) {
    dialog.showAxiosError(err, '關帳失敗')
  } finally {
    actionLoading.value = false
  }
}

// 下載報表：整合型月分潤報表 (含明細、發佣比例、商品收入)
async function exportMonthlyAllInOne() {
  try {
    dialog.showLoading()
    const res = await api.get('/Commission/export-monthly-all-in-one', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob'
    })
    downloadBlob(res.data, `月分潤整合報表_${yearMonth.value}.xlsx`)
  } catch (err) {
    dialog.showError('下載失敗', '無法下載月分潤整合報表')
  } finally {
    dialog.hideLoading()
  }
}

// 下載報表 4：實際發放總表
async function exportClosingPayment() {
  try {
    dialog.showLoading()
    const res = await api.get('/Commission/export-closing-payment-new', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob'
    })
    downloadBlob(res.data, `實際佣金發放薪資總表_${yearMonth.value}.xlsx`)
  } catch (err) {
    dialog.showError('下載失敗', '無法下載實際發放薪資總表')
  } finally {
    dialog.hideLoading()
  }
}

// 下載報表 5：個人佣金單 ZIP
async function downloadZip() {
  try {
    dialog.showLoading()
    const res = await api.get('/Settle/downloadZip', {
      params: { yearMonth: yearMonth.value },
      responseType: 'blob'
    })
    downloadBlob(res.data, `個人佣金單_${yearMonth.value}.zip`)
  } catch (err) {
    dialog.showError('下載失敗', '無法下載個人佣金單壓縮檔')
  } finally {
    dialog.hideLoading()
  }
}

// Helper: 下載 Blob 檔案
function downloadBlob(blobData, fileName) {
  const url = window.URL.createObjectURL(new Blob([blobData]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Helper: 格式化數字為貨幣字串
function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  return Math.floor(num).toLocaleString('zh-TW')
}

// Helper: 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 載入系統設定
async function fetchSystemSettings() {
  try {
    const res = await api.get('/Commission/system-settings')
    if (Array.isArray(res.data)) {
      const trSetting = res.data.find((s) => s.settingKey === 'TaxRate')
      if (trSetting) {
        taxRatePercent.value = parseFloat(trSetting.settingValue) || 5
      }
    }
  } catch (err) {
    console.error('Failed to load system settings:', err)
  }
}

// 初始化預設為上個月
onMounted(async () => {
  yearMonth.value = maxMonth.value
  await fetchSystemSettings()
})

// 監聽月份變更
watch(yearMonth, (val) => {
  if (val) {
    pickerYear.value = parseInt(val.split('-')[0])
  }
  fetchData()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.ga-2 {
  gap: 8px;
}
.ga-3 {
  gap: 12px;
}
</style>
