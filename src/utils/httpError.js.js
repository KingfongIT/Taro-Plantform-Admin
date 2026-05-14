export function normalizeAxiosError(err) {
  // 伺服器有回應（4xx/5xx）
  if (err?.response) {
    const { status, data } = err.response
    if (status >= 500)
      return { kind: 'SERVER_ERROR', status, message: '伺服器發生錯誤，請稍後再試。' }
    if (status === 401) return { kind: 'UNAUTHORIZED', status, message: '帳號或密碼錯誤。' }
    if (status === 403) return { kind: 'FORBIDDEN', status, message: '沒有權限執行此操作。' }
    if (status === 404) return { kind: 'NOT_FOUND', status, message: '找不到資源或路徑錯誤。' }

    return {
      kind: 'CLIENT_ERROR',
      status,
      message: (data && (data.message || data.error)) || '請求有誤。',
    }
  }

  // 請求已送出但沒有回應（多半是 CORS、服務沒啟動、網路、憑證）
  if (err?.request) {
    if (err.code === 'ECONNABORTED') return { kind: 'TIMEOUT', message: '連線逾時，請稍後再試。' }

    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { kind: 'NETWORK_DOWN', message: '無法連線到伺服器!' }
    }

    return { kind: 'NO_RESPONSE', message: '伺服器沒有回應，請稍後再試。' }
  }

  // 送出前錯誤（設定/序列化等）
  return { kind: 'REQUEST_SETUP_ERROR', message: err?.message || '請求設定錯誤。' }
}
