// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LoginPage from '@/pages/LoginPage.vue'
import Dashboard from '@/pages/Dashboard.vue'
import NotFound from '@/pages/NotFound.vue'
import Member from '@/pages/Member.vue'
import PromotionCenter from '@/pages/PromotionCenter.vue'
import Agent from '@/pages/Agent.vue'
import AgentDetail from '@/pages/AgentDetail.vue'
import AgentReview from '@/pages/AgentReview.vue'
import BuildingPage from '@/pages/BuildingPage.vue' // 當作暫時頁 or 403
import Category from '@/pages/Category.vue'
import ProductUpsert from '@/pages/ProductUpsert.vue'
import ExternalMember from '@/pages/ExternalMember.vue'
import ExternalMemberDetail from '@/pages/ExternalMemberDetail.vue'
import FeeTemplate from '@/pages/FeeTemplate.vue'
import Product from '@/pages/Product.vue'
import Order from '@/pages/Order.vue'
import OrderDetail from '@/pages/OrderDetail.vue'
import { useDialogStore } from '@/stores/dialog'
import Admin from '@/pages/Admin.vue'
import CreateAdmin from '@/components/UpsertAdmin.vue'
import Activate from '@/pages/Activate.vue'
import RevenueTemplate from '@/pages/RevenueTemplate.vue'
import Test from '@/pages/test.vue'
import RevenueTemplateHistory from '@/pages/RevenueTemplateHistory.vue'
import Consultant from '@/pages/Consultant.vue'
import ConsultantCategory from '@/pages/Consultant.vue'
import MemberDetail from '@/pages/MemberDetail.vue'
import CourseDetail from '@/pages/CourseDetail.vue'
import RoleUpsert from '@/pages/RoleUpsert.vue'
import Role from '@/pages/Role.vue'
import AgentPayment from '@/pages/AgentPayment.vue'
import TokenSettlement from '@/pages/TokenSettlement.vue'
import CommissionSettlement from '@/pages/CommissionSettlement.vue'
import { components } from 'vuetify/dist/vuetify.js'
import ProfitReport from '@/pages/ProfitReport.vue'
import TokenReport from '@/pages/TokenReport.vue'
import NotTokenSettlement from '@/pages/NotTokenSettlement.vue'

const isDev = import.meta.env.DEV
const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/admin/activate', name: 'Activate', component: Activate },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    redirect: { name: 'home' }, // 直接導到首頁
    children: [
      // 首頁
      {
        path: 'home',
        name: 'home',
        component: Member,
        meta: { requiresAuth: true, title: '首頁' },
      },

      // 會員
      {
        path: 'member',
        children: [
          {
            path: 'all',
            name: 'Members',
            component: Member,
            meta: {
              title: '小芋頭會員',
              requiresAuth: true,
              permission: 'MP_MEMBER_VIEW',
            },
          },
          {
            path: ':guid',
            name: 'MembersDetail',
            component: MemberDetail,
            meta: {
              title: '小芋頭會員詳情',
              requiresAuth: true,
              permission: 'MP_MEMBER_VIEW',
            },
            props: (route) => ({ guid: String(route.params.guid) }),
          },
          {
            path: 'externalMembers',
            name: 'externalMembers',
            component: ExternalMember,
            meta: {
              title: '外部會員',
              requiresAuth: true,
              permission: 'MP_EXTERNAL_MEMBER_VIEW',
            },
          },
          {
            path: 'externalMembers/:id',
            name: 'externalMemberDetail',
            component: ExternalMemberDetail,
            props: true,
            meta: {
              title: '外部會員詳情',
              requiresAuth: true,
              permission: 'MP_EXTERNAL_MEMBER_VIEW',
            },
          },
          {
            path: 'consultant',
            name: 'Consultant',
            component: ConsultantCategory,
            meta: {
              title: '顧問師',
              requiresAuth: true,
              permission: 'MP_CONSULTANT_VIEW',
            },
          },
        ],
      },

      // 代理人
      {
        path: 'agent',
        name: 'Agent',
        component: Agent,
        meta: {
          title: '代理人總覽',
          requiresAuth: true,
          permission: 'AGENT_OVERVIEW_VIEW',
        },
      },
      {
        path: 'agent/:id',
        name: 'AgentDetail',
        component: AgentDetail,
        props: true,
        meta: {
          title: '代理人詳細',
          requiresAuth: true,
          permission: 'AGENT_OVERVIEW_VIEW',
        },
      },
      {
        path: 'review',
        name: 'AgentReview',
        component: AgentReview,
        meta: {
          title: '發佣審核',
          requiresAuth: true,
          permission: 'AGENT_COMMISSION_REVIEW_VIEW',
        },
      },
      {
        path: 'promotionCenter',
        name: 'PromotionCenter',
        component: PromotionCenter,
        meta: {
          title: '推廣中心審核',
          requiresAuth: true,
          permission: 'AGENT_PROMOTION_REVIEW_VIEW',
        },
      },
      {
        path: 'agentPayment',
        name: 'AgentPayment',
        component: AgentPayment,
        meta: {
          title: '代理人付款紀錄',
          requiresAuth: true,
          permission: 'AGENT_PAYMENT_VIEW',
        },
      },

      // 商品管理
      {
        path: 'product',
        children: [
          {
            path: 'order',
            children: [
              {
                path: '',
                name: 'Order',
                component: Order, // 訂單列表頁
                meta: {
                  title: '訂單案件',
                  requiresAuth: true,
                  permission: 'ORDER_CASE_VIEW',
                },
              },
              {
                path: ':id(\\d+)',
                name: 'OrderDetail',
                component: OrderDetail,
                meta: {
                  title: '訂單明細',
                  requiresAuth: true,
                  permission: 'ORDER_CASE_VIEW',
                },
                props: (route) => ({ id: Number(route.params.id) }),
              },
            ],
          },
          {
            path: 'index',
            name: 'Product',
            component: Product,
            meta: {
              title: '商品管理',
              requiresAuth: true,
              permission: 'PRODUCT_MANAGE_VIEW',
            },
          },
          {
            path: 'course',
            children: [
              {
                path: '',
                name: 'Course',
                component: Product,
                meta: {
                  title: '課程商品管理',
                  requiresAuth: true,
                  permission: 'COURSE_VIEW',
                },
              },
              {
                path: ':id(\\d+)',
                name: 'CourseDetail',
                component: CourseDetail,
                meta: {
                  title: '課程內容設定',
                  requiresAuth: true,
                  permission: 'COURSE_EDIT',
                },
                props: (route) => ({ id: Number(route.params.id) }),
              },
            ],
          },
          {
            path: 'category',
            name: 'Category',
            component: Category,
            meta: {
              title: '商品類別',
              requiresAuth: true,
              permission: 'PRODUCT_CATEGORY_VIEW',
            },
          },
          {
            path: 'create',
            name: 'ProductCreate',
            component: ProductUpsert,
            meta: {
              title: '新增商品',
              requiresAuth: true,
              permission: 'PRODUCT_MANAGE_VIEW',
            },
          },
          {
            path: ':id(\\d+)',
            name: 'ProductEdit',
            component: ProductUpsert,
            meta: {
              title: '商品管理',
              requiresAuth: true,
              permission: 'PRODUCT_MANAGE_VIEW',
            },
            props: (route) => ({ id: Number(route.params.id), isEdit: true }),
          },
          // {
          //   path: 'feeTemplate',
          //   name: 'FeeTemplate',
          //   component: FeeTemplate,
          //   meta: {
          //     title: '商品費用科目參數',
          //     requiresAuth: true,
          //   },
          // },
          {
            path: 'revenueTemplate',
            name: 'RevenueTemplate',
            component: RevenueTemplate,
            meta: {
              title: '分潤模板',
              requiresAuth: true,
              permission: 'FEE_TEMPLATE_VIEW',
            },
          },
          {
            path: 'revenueTemplate/:id(\\d+)',
            name: 'RevenueTemplateHistory',
            component: RevenueTemplateHistory,
            meta: {
              title: '分潤模板詳情',
              requiresAuth: true,
              permission: 'FEE_TEMPLATE_VIEW',
            },
            props: (route) => ({ id: Number(route.params.id) }),
          },
        ],
      },

      //案件發傭
      {
        path: 'commission',
        children: [
          {
            path: 'commissionSettlement',
            name: 'CommissionSettlement',
            component: CommissionSettlement,
            meta: {
              title: '案件結算作業',
              requiresAuth: true,
              permission: 'PRODUCT_CASESETTLEMENT_VIEW',
            },
          },
          {
            path: 'tokenSettlement',
            name: 'TokenSettlement',
            component: TokenSettlement,
            meta: {
              title: '雞肉結算作業',
              requiresAuth: true,
              permission: 'PRODUCT_CASESETTLEMENT_VIEW',
            },
          },
          {
            path: 'NotTokenSettlement',
            name: 'NotTokenSettlement',
            component: NotTokenSettlement,
            meta: {
              title: '小芋頭雞肉飼料發佣',
              requiresAuth: true,
              permission: 'PRODUCT_CASESETTLEMENT_VIEW',
            },
          },
          {
            path: 'tokenReport',
            name: 'TokenReport',
            component: TokenReport,
            meta: {
              title: '小芋頭雞肉飼料報表',
              requiresAuth: true,
              permission: 'PRODUCT_CASESETTLEMENT_VIEW',
            },
          },
          {
            path: 'profitReport',
            name: 'ProfitReport',
            component: ProfitReport,
            meta: {
              title: '公司收益報表',
              requiresAuth: true,
              permission: 'PRODUCT_CASESETTLEMENT_VIEW',
            },
          },
        ],
      },

      // 系統後臺管理
      {
        path: 'system',
        children: [
          {
            path: 'admin',
            children: [
              {
                path: '',
                name: 'Admin',
                component: Admin,
                meta: {
                  title: '管理者列表',
                  requiresAuth: true,
                  permission: 'SYS_Admin_VIEW',
                },
              },
            ],
          },
          {
            path: 'role',
            children: [
              {
                path: '',
                name: 'Role',
                component: Role,
                meta: {
                  title: '角色列表',
                  requiresAuth: true,
                  permission: 'SYS_ROLE_VIEW',
                },
              },
              {
                path: 'create',
                name: 'RoleCreate',
                component: RoleUpsert,
                meta: {
                  title: '新增角色',
                  requiresAuth: true,
                  permission: 'SYS_ROLE_VIEW',
                },
              },
              {
                path: 'edit/:id',
                name: 'RoleEdit',
                component: RoleUpsert,
                meta: {
                  title: '編輯角色',
                  requiresAuth: true,
                  permission: 'SYS_ROLE_VIEW',
                },
                props: (route) => ({ id: String(route.params.id) }),
              },
            ],
          },
        ],
      },
    ],
  },
  // 維修頁面
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: BuildingPage,
    meta: { title: '無權限' },
  },
  {
    path: '/test',
    name: 'Test',
    component: Test,
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to, from, next) => {
  const dialog = useDialogStore()
  const authStore = useAuthStore()

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)

  // 👉 開發模式 + 允許跳過登入 → 完全不檢查
  // if (isDev) {
  //   return next()
  // }

  if (!requiresAuth) {
    return next()
  }

  // 如果目前沒有有效 token，先試著用 refreshToken Cookie 換一顆新的
  if (!authStore.isTokenValid) {
    const newToken = await authStore.refreshToken()
    if (!newToken) {
      authStore.clearToken()
      return next({ name: 'Login' })
    }
  }

  //確保 permissions 已載入
  if (!authStore.permissions || authStore.permissions.length === 0) {
    try {
      await authStore.fetchMyPermissions()
    } catch (e) {
      // 拿不到 permissions 時：通常是 token 有問題或後端掛了
      dialog.showError('驗證錯誤', '無法取得權限資料，請重新登入')
      authStore.clearToken()
      return next({ name: 'Login' })
    }
  }

  //若是只有課程規劃則跳去課程規劃的畫面
  // ✅ OfficeAdmin 首頁導向（放在 roles 權限檢查前）
  const onlyCourse = authStore.hasPermission('COURSE_VIEW') && !authStore.hasPermission('DASHBOARD')
  if (onlyCourse && to.name === 'home') {
    return next({ name: 'Course' }) // 改成你要去的頁
  }

  //權限檢查
  const requiredPerm = to.meta.permission
  const requiredPerms = to.meta.permissions

  if (requiredPerm) {
    const ok = authStore.permissions.includes(requiredPerm)
    if (!ok) {
      dialog.showError('操作錯誤', '無此權限')
      return next({ name: 'Forbidden' }) // 比 next(false) 好，使用者看得懂
    }
  }

  if (Array.isArray(requiredPerms) && requiredPerms.length > 0) {
    const ok = requiredPerms.some((p) => authStore.permissions.includes(p))
    if (!ok) {
      dialog.showError('操作錯誤', '無此權限')
      return next({ name: 'Forbidden' })
    }
  }

  // 有角色限制 → 檢查角色
  // const allowedRoles = to.meta.roles ?? []
  // if (allowedRoles.length > 0) {
  //   const hasRole = authStore.roles.some((r) => allowedRoles.includes(r))

  //   if (!hasRole) {
  //     dialog.showError('操作錯誤', '無此權限')
  //     return next(false)
  //   }
  // }

  next()
})

export default router
