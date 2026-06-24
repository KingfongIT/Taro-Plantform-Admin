import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'
import router from '@/router'
import { useDialogStore } from './dialog'
import { normalizeAxiosError } from '@/utils/httpError.js'
import api from '@/plugins/api'
import { computed } from 'vue'

const baseURL = import.meta.env.VITE_API_URL
const isDev = import.meta.env.DEV

function getSafeRedirectPath(value) {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  if (value.startsWith('/login')) return null
  return value
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    permissions: [],
  }),
  getters: {
    // 檢查token是否有效（未過期）
    isTokenValid: (state) => {
      // if (isDev) return true
      if (!state.token) return false
      try {
        const payload = jwtDecode(state.token)
        const now = Date.now() / 1000
        return !(payload.exp && payload.exp < now)
      } catch (e) {
        console.error('Token解析錯誤:', e)
        return false
      }
    },

    //取得角色
    roles: (state) => {
      // if (isDev) return ['admin']
      if (!state.token) return []
      const payload = jwtDecode(state.token)
      const rawRole = payload.role ?? []
      if (!rawRole) return []
      return Array.isArray(rawRole) ? rawRole : [rawRole]
    },

    //是否有這權限
    hasPermission: (state) => (perm) => {
      return state.permissions.includes(perm)
    },

    //目前使用者
    currentUser: (state) => {
      // if (isDev) return { id: 'admin', userName: 'admin', roles: ['admin'] }
      if (!state.token) return null
      try {
        const payload = jwtDecode(state.token)

        return {
          id: payload.sub,
          userName: payload.name,
          roles: payload.role ?? [],
        }
      } catch {
        return null
      }
    },
  },
  actions: {
    // 登入
    async login(username, password) {
      const dialog = useDialogStore()

      // 開發模式不進入
      // if (isDev) {
      //   router.push({ name: 'home' })
      //   return
      // }

      if (!username || !password) {
        dialog.showError('驗證錯誤', '帳號與密碼不得為空')
        return
      }

      dialog.showLoading()
      try {
        const res = await axios.post(
          `${baseURL}/admin/login`,
          { username, password },
          { withCredentials: true },
        )

        if (res.status >= 200 && res.status < 300) {
          const token = res.data?.accessToken

          if (!token) {
            dialog.showError('登入錯誤', '伺服器未傳回有效 token')
            return
          }
          this.setToken(token)
          await this.fetchMyPermissions()
          const redirectPath = getSafeRedirectPath(router.currentRoute.value.query.redirect)
          if (redirectPath) {
            router.replace(redirectPath)
          } else {
            router.replace({ name: 'home' })
          }
          return
        }

        // 有回應但非 2xx → 視作伺服器錯誤或用戶端錯誤
        const normalized = normalizeAxiosError({ response: res })
        dialog.showError('登入失敗', normalized.message)
      } catch (err) {
        dialog.showAxiosError(err, '登入失敗')
      } finally {
        dialog.hideLoading()
      }
    },

    // 登出
    async logout() {
      const dialog = useDialogStore()
      dialog.showLoading()
      try {
        await api.post(`/admin/logout`)
        this.clearToken()

        if (router.currentRoute.value.name !== 'Login') {
          router.push({ name: 'Login' })
        }
      } catch (err) {
        dialog.showAxiosError(err, '登出失敗')
      } finally {
        dialog.hideLoading()
      }
    },

    // 取得權限
    async fetchMyPermissions() {
      if (!this.token) {
        this.permissions = []
        return
      }

      try {
        const { data } = await api.get('/admin/me/permissions')
        this.permissions = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('取得 permissions 失敗', err)
        this.permissions = []
      }
    },

    // refreshToken
    async refreshToken() {
      try {
        const { data } = await axios.post(`${baseURL}/admin/refresh`, {}, { withCredentials: true })
        const newToken = data.accessToken
        this.setToken(newToken)
        return newToken
      } catch (error) {
        this.clearToken()
        return null
      }
    },

    setToken(token) {
      this.token = token
    },

    clearToken() {
      this.token = null
      this.permissions = []
    },
  },
})
