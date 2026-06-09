// stores/dialog.js
import { normalizeAxiosError } from '@/utils/httpError.js'
import { defineStore } from 'pinia'

export const useDialogStore = defineStore('dialog', {
  state: () => ({
    // loading
    loading: false,

    // error
    errorVisible: false,
    errorTitle: '',
    errorMessage: '',
    isSuccess: false,

    // confirm
    isDelete: false,
    confirmVisible: false,
    confirmTitle: '',
    confirmMessage: '',
  }),

  actions: {
    _resolve: null,
    // Loading
    showLoading() {
      this.loading = true
    },
    hideLoading() {
      this.loading = false
    },

    // Error & Success Dialog
    showError(title, message) {
      this.errorTitle = title
      this.errorMessage = message
      this.isSuccess = false
      this.errorVisible = true
    },
    showSuccess(title, message) {
      this.errorTitle = title
      this.errorMessage = message
      this.isSuccess = true
      this.errorVisible = true
    },
    closeError() {
      this.errorTitle = ''
      this.errorMessage = ''
      this.isSuccess = false
      this.errorVisible = false
    },
    showAxiosError(err, defaultTitle = '操作失敗') {
      const normalized = normalizeAxiosError(err)

      const titleMap = {
        NETWORK_DOWN: '無法連線伺服器',
        TIMEOUT: '連線逾時',
        NO_RESPONSE: '伺服器無回應',
        REQUEST_SETUP_ERROR: '請求設定錯誤',
      }

      const title = titleMap[normalized.kind] || defaultTitle
      this.showError(title, normalized.message)
    },

    // ✅ 關鍵：回傳 Promise<boolean>
    askConfirm({ title, message, isDelete }) {
      this.confirmTitle = title || ''
      this.confirmMessage = message || ''
      this.isDelete = isDelete || false
      this.confirmVisible = true

      return new Promise((resolve) => {
        this._resolve = resolve
      })
    },

    // 由對話框的按鈕觸發
    confirm() {
      this.confirmVisible = false
      if (this._resolve) this._resolve(true)
      this._resolve = null
      this.confirmTitle = ''
      this.confirmMessage = ''
    },
    cancel() {
      this.confirmVisible = false
      if (this._resolve) this._resolve(false)
      this._resolve = null
      this.confirmTitle = ''
      this.confirmMessage = ''
    },
  },
})
