import { useAuthStore } from '@/stores/auth'

export function usePermission() {
  const auth = useAuthStore()
  const has = (code) => auth.isSuperAdmin || auth.permissions.includes(code)
  const hasAny = (codes) => auth.isSuperAdmin || codes.some((c) => auth.permissions.includes(c))
  return { has, hasAny }
}
