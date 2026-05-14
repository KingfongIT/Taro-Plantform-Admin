import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

// 請求前自動夾帶 JWT
api.interceptors.request.use((config) => {
  const url = config.url ?? ''

  if (url.includes('/admin/login') || url.includes('/admin/refresh')) {
    return config
  }

  const authStore = useAuthStore()
  if (authStore.isTokenValid && authStore.token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  return config
})

// 回應攔截（處理過期）
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalReq = error.config

    if (error.response && error.response.status === 401 && !originalReq._retry) {
      originalReq._retry = true
      const authStore = useAuthStore()
      const newToken = await authStore.refreshToken()
      if (newToken) {
        originalReq.headers = originalReq.headers || {}
        originalReq.headers.Authorization = `Bearer ${newToken}`
        return api(originalReq)
      }
    }
    return Promise.reject(error)
  },
)

export default api
