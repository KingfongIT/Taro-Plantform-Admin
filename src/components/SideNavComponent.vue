<template>
  <v-navigation-drawer permanent max-width="240">
    <v-list>
      <div class="d-flex align-center ml-6 my-2">
        <img max-width="23px" src="/images/小芋頭CRM.svg" alt="" />
        <h1><i>小芋頭CRM</i></h1>
      </div>
    </v-list>
    <v-divider></v-divider>
    <v-list nav v-model:opened="open" color="primary">
      <template v-for="item in navbarFiltered" :key="item.value">
        <v-list-group v-if="item.children">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :prepend-icon="item.icon"
              :title="item.title"
              :disabled="item.disabled"
            >
            </v-list-item>
          </template>
          <v-list-item
            v-for="child in item.children"
            :key="child.title"
            :title="child.title"
            :to="child.path"
            :disabled="item.disabled"
          >
            <template #append v-if="child.append">
              <v-badge color="error" inline :content="child.append"> </v-badge>
            </template>
          </v-list-item>
        </v-list-group>
        <v-divider v-else-if="item.type == 'divider'"></v-divider>
        <v-list-subheader v-else-if="item.type == 'subheader'">{{ item.title }}</v-list-subheader>
        <v-list-item
          v-else
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.path"
          :disabled="item.disabled"
        ></v-list-item>
      </template>
    </v-list>
    <v-list class="logout">
      <v-list-item :prepend-icon="Logout_Icon" @click.prevent="logoutbtn">登出</v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup name="SideNav">
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref, computed } from 'vue'
import { useDialogStore } from '@/stores/dialog'
import { useReviewStore } from '@/stores/review'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

const isDev = import.meta.env.DEV
const router = useRouter()
const auth = useAuthStore()
const dialog = useDialogStore()
const reviewStore = useReviewStore()

const promotionCenterCount = computed(() => reviewStore?.promotionCenterCount ?? 0)
const agentCount = computed(() => reviewStore?.agentCount ?? 0)

const isSuperAdmin = computed(() => auth.roles.includes('Admin'))

/** 判斷某個路由 name 是否允許目前角色 */
// function routeAllows(name) {
//   if (!name) return true
//   const r = router.getRoutes().find((rr) => rr.name === name)
//   const roles = r?.meta?.roles
//   const userRoles = auth.roles

//   if (!roles || roles.length === 0) return true

//   return userRoles.some((role) => roles.includes(role))
// }

function routeAllows(name) {
  if (!name) return true
  const r = router.getRoutes().find((rr) => rr.name === name)
  const meta = r?.meta ?? {}

  // Admin全開
  if (auth.roles?.includes('Admin')) return true

  // 單一權限：meta.permission
  if (meta.permission) {
    return auth.permissions?.includes(meta.permission)
  }

  // 多權限任一即可：meta.permissions
  if (Array.isArray(meta.permissions) && meta.permissions.length > 0) {
    return meta.permissions.some((p) => auth.permissions?.includes(p))
  }

  // 兼容舊制：roles（你還沒搬完前可保留）
  // if (Array.isArray(meta.roles) && meta.roles.length > 0) {
  //   return auth.roles?.some((role) => meta.roles.includes(role))
  // }

  // 沒設定限制 → 顯示
  return true
}

/** 過濾 navbar（保留 divider/subheader；群組若全被過濾會整組隱藏） */
function filterByRole(nodes) {
  const out = []
  for (const n of nodes) {
    if (n?.type === 'divider' || n?.type === 'subheader') {
      out.push(n)
      continue
    }
    if (Array.isArray(n?.children)) {
      const kids = filterByRole(n.children)
      if (kids.length) out.push({ ...n, children: kids })
    } else {
      // 你的 path 是 { name: 'xxx' }，用 name 去查 meta.roles
      const name = n?.path?.name
      if (routeAllows(name)) out.push(n)
    }
  }
  // 清掉連續/頭尾的 divider，避免空白
  return out
    .filter((x, i, a) => !(x.type === 'divider' && (i === 0 || a[i - 1]?.type === 'divider')))
    .slice(0, out.at(-1)?.type === 'divider' ? -1 : undefined)
}

const navbarFiltered = computed(() => {
  // dev 模式：直接顯示原始 navbar，不過濾
  // if (isDev) return navbar.value

  //若是Admin就顯示所有navbar
  if (isSuperAdmin.value) return navbar.value

  return filterByRole(navbar.value)
})

const open = ref([])
const navbar = ref([
  //主頁
  { title: '首頁', value: 'home', icon: 'home', path: { name: 'home' } },
  { type: 'divider' },

  // 小芋頭會員平台
  {
    title: '小芋頭會員平台',
    value: 'member',
    icon: 'person',
    children: [
      {
        title: '小芋頭會員',
        value: 'members',
        path: { name: 'Members' },
      },
      {
        title: '外部會員',
        value: 'externalMembers',
        path: { name: 'externalMembers' },
      },
      {
        title: '顧問師',
        value: 'consultant',
        path: { name: 'Consultant' },
      },
    ],
  },
  { type: 'divider' },

  //代理人
  {
    title: '代理人',
    value: 'agent',
    icon: 'account_tree',
    children: [
      {
        title: '代理人總覽',
        value: 'Agent',
        path: { name: 'Agent' },
      },
      {
        title: '推廣中心審核',
        value: 'PromotionCenter',
        path: { name: 'PromotionCenter' },
        append: promotionCenterCount,
      },
      {
        title: '發佣審核',
        value: 'AgentReview',
        path: { name: 'AgentReview' },
        append: agentCount,
      },
      {
        title: '付款紀錄',
        value: 'AgentPayment',
        path: { name: 'AgentPayment' },
      },
      // {
      //   title: '代理人優惠',
      //   value: 'promotion',
      //   path: { name: '' },
      // },
      // {
      //   title: '代理人參數',
      //   value: 'promotion',
      //   path: { name: '' },
      // },
    ],
  },
  { type: 'divider' },

  //商品及訂單案件
  {
    title: '商品及訂單案件',
    value: 'product',
    icon: 'local_mall',
    children: [
      {
        title: '訂單案件',
        value: 'Order',
        path: { name: 'Order' },
      },
      // {
      //   title: '案件結算作業',
      //   value: 'CaseSettlement',
      //   path: { name: 'CaseSettlement' },
      // },
      {
        title: '課程商品管理',
        value: 'Course',
        path: { name: 'Course' },
      },
      {
        title: '商品管理',
        value: 'Product',
        path: { name: 'Product' },
      },
      {
        title: '商品分類',
        value: 'Category',
        path: { name: 'Category' },
      },
      // {
      //   title: '商品折扣優惠',
      //   value: 'promotion',
      //   path: { name: '' },
      // },
      // {
      //   title: '商品費用科目參數',
      //   value: 'FeeTemplate',
      //   path: { name: 'FeeTemplate' },
      // },
      {
        title: '分潤模板',
        value: 'RevenueTemplate',
        path: { name: 'RevenueTemplate' },
      },
    ],
  },
  { type: 'divider' },

  //案件發傭
  {
    title: '案件發佣',
    value: 'commission',
    icon: 'monetization_on',
    children: [
      // {
      //   title: '金流統計報表',
      //   value: 'Report',
      //   path: { name: 'Report' },
      // },
      {
        title: '案件結算作業',
        value: 'CommissionSettlement',
        path: { name: 'CommissionSettlement' },
      },
      {
        title: '小芋頭雞肉飼料發佣 ',
        value: 'TokenSettlement',
        path: { name: 'TokenSettlement' },
      },
      // {
      //   title: '非小芋頭雞肉飼料發佣',
      //   value: 'NotTokenSettlement',
      //   path: { name: 'NotTokenSettlement' },
      // },
      // {
      //   title: '公司收益報表',
      //   value: 'ProfitReport',
      //   path: { name: 'ProfitReport' },
      // },
    ],
  },
  { type: 'divider' },
  //服務
  // { type: 'subheader', title: '服務' },
  // {
  //   title: '小芋頭社群管理',
  //   value: 'groups',
  //   icon: 'groups',
  // },
  // {
  //   title: '廣告管理',
  //   value: 'ads',
  //   icon: 'touch_app',
  // },
  // {
  //   title: '企業AI網站',
  //   value: 'ai_site',
  //   icon: 'auto_awesome',
  //   children: [
  //     {
  //       title: '企業AI網站管理',
  //       // value: 'Agent',
  //       // path: { name: 'Agent' },
  //     },
  //   ],
  // },
  // { type: 'divider' },

  //制度與商業邏輯
  // {
  //   title: '制度與商業邏輯',
  //   value: 'rule',
  //   icon: 'currency_exchange',
  //   children: [
  //     {
  //       title: '分潤模組',
  //       // value: 'Agent',
  //       // path: { name: 'Agent' },
  //     },
  //     {
  //       title: '位階制度模板',
  //       // value: 'promotion',
  //       // path: { name: 'PromotionCenter' },
  //     },
  //     {
  //       title: '檢查與版本控制',
  //       // value: 'AgentReview',
  //       // path: { name: 'AgentReview' },
  //     },
  //   ],
  // },
  // { type: 'divider' },

  //飼料與點數
  // {
  //   title: '飼料與點數',
  //   value: 'point',
  //   icon: 'pets',
  //   children: [
  //     {
  //       title: '雞肉飼料',
  //       // value: 'Agent',
  //       // path: { name: 'Agent' },
  //     },
  //     {
  //       title: '牛肉飼料',
  //       // value: 'promotion',
  //       // path: { name: 'PromotionCenter' },
  //     },
  //     {
  //       title: '飼料結算與匯出報表',
  //       // value: 'AgentReview',
  //       // path: { name: 'AgentReview' },
  //     },
  //     {
  //       title: '商品與貨幣參數',
  //       // value: 'AgentReview',
  //       // path: { name: 'AgentReview' },
  //     },
  //     {
  //       title: 'PV點數',
  //       // value: 'AgentReview',
  //       // path: { name: 'AgentReview' },
  //     },
  //   ],
  // },
  // { type: 'divider' },

  //系統後台
  {
    title: '系統後台',
    value: 'system',
    icon: 'admin_panel_settings',
    children: [
      {
        title: '後臺人員',
        value: 'Admin',
        path: { name: 'Admin' },
      },
      {
        title: '角色權限管理',
        value: 'Role',
        path: { name: 'Role' },
      },
    ],
  },
  { type: 'divider' },

  // 外部連結：用 href + target
  // { title: 'Docs', value: 'docs', href: 'https://vuetifyjs.com/', target: '_blank' },
])

const Logout_Icon = 'logout'

async function logoutbtn() {
  const ok = await dialog.askConfirm({
    title: '登出',
    message: '確定要登出嗎？',
    isDelete: true,
  })
  if (!ok) return

  auth.logout()
}

onMounted(async () => {
  reviewStore.fetchPendingCount()
})
</script>

<style scoped lang="scss">
.v-navigation-drawer {
  color: rgb(var(--v-theme-gray_100));

  h1 {
    color: black;
    font-size: 20px;
    margin-left: 5px;
  }

  .v-list-item:hover {
    color: rgb(var(--v-theme-primary));
    background-color: #e3f2fc;
  }
}

.logout {
  .v-list-item:hover {
    color: rgb(var(--v-theme-error));
    background-color: #ffebee;
  }
}
</style>
