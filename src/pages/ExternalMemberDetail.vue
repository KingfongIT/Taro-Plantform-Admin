<template>
  <v-container fluid class="pa-6 pb-0">
    <div class="main-title flex-row align-center">
      <v-btn
        :width="100"
        class="mr-4"
        prepend-icon="arrow_back"
        variant="tonal"
        @click="$router.back()"
        >返回</v-btn
      >
      <h2>外部會員</h2>
    </div>
  </v-container>
  <v-tabs bg-color="light-blue-lighten-5" color="primary"
    ><v-tab width="115">基本資料</v-tab></v-tabs
  >
  <v-row class="page-wrapper pa-6">
    <v-col cols="8">
      <v-card border class="mb-4">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-4" color="primary" bg-color="primary">inventory</v-icon>
            基本資料
          </div>
          <v-btn color="primary" variant="outlined" @click="edit = true" v-if="!edit">編輯</v-btn>
          <div v-if="edit">
            <v-btn class="mr-4" color="primary" variant="flat" @click="editMember()">儲存</v-btn>
            <v-btn color="secondary" variant="flat" @click="edit = false">取消</v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">姓名或公司名稱</v-label>
              <p v-if="!edit" class="mb-0">{{ member.name ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.name"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">性別</v-label>
              <p v-if="!edit" class="mb-0">{{ member.gender ?? '無資料' }}</p>
              <v-select
                v-else
                class="pe-8"
                v-model="member.gender"
                :items="['男', '女']"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">聯絡信箱</v-label>
              <p v-if="!edit" class="mb-0">{{ member.email ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.email"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">連絡電話</v-label>
              <p v-if="!edit" class="mb-0">{{ member.phone ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.phone"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">聯絡地址</v-label>
              <p v-if="!edit" class="mb-0">{{ member.address ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.address"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">統編</v-label>
              <p v-if="!edit" class="mb-0">{{ member.taxId ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.taxId"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">行業別</v-label>
              <p v-if="!edit" class="mb-0">{{ member.industry ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.industry"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">負責人</v-label>
              <p v-if="!edit" class="mb-0">{{ member.president ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.president"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">公司連絡電話</v-label>
              <p v-if="!edit" class="mb-0">{{ member.companyTel ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.companyTel"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">網站</v-label>
              <p v-if="!edit" class="mb-0">{{ member.site ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.site"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">企業聯絡地址</v-label>
              <p v-if="!edit" class="mb-0">{{ member.companyAddress ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.companyAddress"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <v-card border>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-4" color="warning" bg-color="primary">account_balance_wallet</v-icon>
            銀行資訊
          </div>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">帳戶名稱</v-label>
              <p v-if="!edit" class="mb-0">{{ member.accountName ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.accountName"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">銀行代號</v-label>
              <p v-if="!edit" class="mb-0">{{ member.bankCode ?? '無資料' }}</p>
              <v-autocomplete
                v-else
                class="pe-8"
                variant="outlined"
                density="compact"
                v-model="member.bankCode"
                :items="bank"
                item-title="name"
                item-value="code"
                :filter-keys="['title', 'raw.code']"
                clearable
              >
                <!-- 下拉項目 -->
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="`${item.raw.code} ${item.raw.name}`" />
                </template>
                <!-- 已選顯示 -->
                <template #selection="{ item }">
                  <span>{{ item.raw.code }} {{ item.raw.name }}</span>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">銀行分行</v-label>
              <p v-if="!edit" class="mb-0">{{ member.branchCode ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.branchCode"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6" class="my-2">
              <v-label class="mb-1">銀行帳號 </v-label>
              <p v-if="!edit" class="mb-0">{{ member.bankAccount ?? '無資料' }}</p>
              <v-text-field
                v-else
                class="pe-8"
                v-model="member.bankAccount"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col>
      <v-card border>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-4" color="primary" bg-color="primary">inventory</v-icon>
            其他資訊
          </div>
        </v-card-title>
        <v-card-text>
          <v-table>
            <tbody>
              <tr>
                <td>
                  會員權限
                  <v-chip
                    v-if="!edit"
                    class="ml-2"
                    size="small"
                    :color="getStatusColor(member.isActive)"
                    :prepend-icon="getStatusIcon(member.isActive)"
                  >
                    {{ getStatusText(member.isActive) }}
                  </v-chip>
                </td>
                <td>
                  <v-switch
                    v-if="edit"
                    color="primary"
                    hide-details
                    inset
                    v-model="member.isActive"
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <p>備註</p>
                </td>
                <td>
                  <v-textarea></v-textarea>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import api from '@/plugins/api'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => route.params.id)
const member = ref({})
const bank = [
  { code: '004', name: '臺灣銀行股份有限公司' },
  { code: '005', name: '臺灣土地銀行股份有限公司' },
  { code: '006', name: '合作金庫商業銀行股份有限公司' },
  { code: '007', name: '第一商業銀行股份有限公司' },
  { code: '008', name: '華南商業銀行股份有限公司' },
  { code: '009', name: '彰化商業銀行股份有限公司' },
  { code: '011', name: '上海商業儲蓄銀行股份有限公司' },
  { code: '012', name: '台北富邦商業銀行股份有限公司' },
  { code: '013', name: '國泰世華商業銀行股份有限公司' },
  { code: '015', name: '中國輸出入銀行' },
  { code: '016', name: '高雄銀行股份有限公司' },
  { code: '017', name: '兆豐國際商業銀行股份有限公司' },
  { code: '018', name: '全國農業金庫' },
  { code: '020', name: '日商瑞穗銀行股份有限公司' },
  { code: '021', name: '花旗(台灣)商業銀行股份有限公司' },
  { code: '022', name: '美商美國銀行' },
  { code: '023', name: '泰國盤谷銀行股份有限公司' },
  { code: '025', name: '菲律賓首都銀行' },
  { code: '028', name: '美商美國紐約梅隆銀行股份有限公司' },
  { code: '029', name: '新加坡商大華銀行有限公司' },
  { code: '030', name: '美商道富銀行股份有限公司' },
  { code: '037', name: '法商法國興業銀行股份有限公司' },
  { code: '039', name: '澳盛(台灣)商業銀行' },
  { code: '040', name: '中華開發工業銀行股份有限公司' },
  { code: '048', name: '王道商業銀行股份有限公司' },
  { code: '050', name: '臺灣中小企業銀行股份有限公司' },
  { code: '052', name: '渣打國際商業銀行股份有限公司' },
  { code: '053', name: '台中商業銀行股份有限公司' },
  { code: '054', name: '京城商業銀行股份有限公司' },
  { code: '072', name: '德商德意志銀行' },
  { code: '075', name: '香港商東亞銀行' },
  { code: '076', name: '美商摩根大通銀行股份有限公司' },
  { code: '078', name: '新加坡商星展銀行股份有限公司' },
  { code: '081', name: '滙豐(台灣)商業銀行股份有限公司' },
  { code: '082', name: '法商法國巴黎銀行' },
  { code: '101', name: '瑞興商業銀行股份有限公司' },
  { code: '102', name: '華泰商業銀行股份有限公司' },
  { code: '103', name: '臺灣新光商業銀行股份有限公司' },
  { code: '108', name: '陽信商業銀行股份有限公司' },
  { code: '118', name: '板信商業銀行股份有限公司' },
  { code: '147', name: '三信商業銀行股份有限公司' },
  { code: '700', name: '中華郵政股份有限公司' },
  { code: '803', name: '聯邦商業銀行股份有限公司' },
  { code: '805', name: '遠東國際商業銀行股份有限公司' },
  { code: '806', name: '元大商業銀行股份有限公司' },
  { code: '807', name: '永豐商業銀行股份有限公司' },
  { code: '808', name: '玉山商業銀行股份有限公司' },
  { code: '809', name: '凱基商業銀行股份有限公司' },
  { code: '810', name: '星展(臺灣)商業銀行股份有限公司' },
  { code: '812', name: '台新國際商業銀行股份有限公司' },
  { code: '815', name: '日盛國際商業銀行股份有限公司' },
  { code: '816', name: '安泰商業銀行股份有限公司' },
  { code: '822', name: '中國信託商業銀行股份有限公司' },
  { code: '823', name: '將來商業銀行股份有限公司' },
  { code: '824', name: '連線商業銀行股份有限公司' },
  { code: '826', name: '樂天國際商業銀行股份有限公司' },
]
const edit = ref(false)

async function fetchData() {
  try {
    const { data } = await api.get(`/ExternalMember/Get/${id.value}`)
    member.value = data
  } catch (error) {
    console.log(error)
  }
}

async function editMember() {
  if (!id?.value) throw new Error('缺少 id')

  try {
    const url = `/ExternalMember/Edit/${id.value}`
    // 注意 JSON 命名：若後端用 System.Text.Json 預設 camelCase，
    // 請確認你送的 key 也是 camelCase，或調整後端序列化設定。
    const payload = {
      name: member.value.name,
      email: member.value.email,
      gender: member.value.gender,
      phone: member.value.phone,
      address: member.value.address,
      president: member.value.president,
      taxId: member.value.taxId,
      industry: member.value.industry,
      companyTel: member.value.companyTel,
      companyAddress: member.value.companyAddress,
      site: member.value.site,
      accountName: member.value.accountName,
      accountNumber: member.value.accountNumber,
      bankName: member.value.bankName,
      bankCode: member.value.bankCode,
      branchCode: member.value.branchCode,
      note: member.value.note,
      isActive: member.value.isActive,
    }

    const { data } = await api.put(url, payload)

    edit.value = false
  } catch (error) {
    console.log(error)
  }
}

function getStatusIcon(status) {
  if (status) {
    return 'check_circle'
  }
  return 'block'
}

function getStatusText(status) {
  if (status) {
    return '正常'
  }
  return '停權'
}

function getStatusColor(status) {
  if (status) {
    return 'success'
  }
  return 'error'
}
onMounted(() => {
  fetchData()
})
</script>
<style scoped>
.page-wrapper {
  display: flex;
  min-height: 100vh; /*頁面最少全螢幕高度*/
}
</style>
