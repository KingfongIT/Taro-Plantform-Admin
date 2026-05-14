import { computed } from 'vue'

function toList(v) {
  if (!v) return []
  if (v instanceof File) return [v]
  if (Array.isArray(v)) return v.filter(Boolean)
  return []
}

export function useProductRules(productModel) {
  const required = (v) => (v !== null && v !== undefined && String(v).trim() !== '') || '必填'

  const nonNegative = (v) => v >= 0 || '不可為負數'

  const isMoney = (v) =>
    v === null ||
    v === undefined ||
    /^(\d+)(\.\d{1,2})?$/.test(String(v)) ||
    '金額格式不正確(小數2位)'

  const codeFormat = (v) => !v || /^[A-Z0-9-]+$/.test(v) || '僅允許 A-Z, 0-9, -'

  const percent0to100 = (v) =>
    v === null || v === undefined || (Number(v) >= 0 && Number(v) <= 100) || '需介於 0~100'

  // 跨欄位：特價 ≤ 原價
  const discountLEPrice = computed(() => {
    return (v) =>
      v === null ||
      v === undefined ||
      Number(v) <= Number(productModel.value.price ?? 0) ||
      '特價不得高於原價'
  })

  /** 必須上傳至少一個檔案（單檔或多檔都可） */
  const requiredFile =
    (msg = '請上傳檔案') =>
    (v) => {
      return toList(v).length > 0 || msg
    }

  /** 允許的 MIME 類型（例：['image/png','image/jpeg']）或以 'image/' 前綴 */
  const fileTypes =
    (types, msg = '檔案格式不符合') =>
    (v) => {
      const files = toList(v)
      return files.every((f) => types.some((t) => f.type === t || f.type?.startsWith(t))) || msg
    }

  /** 單檔大小上限（MB） */
  const maxSizeMB = (mb, msg) => (v) => {
    const bytes = mb * 1024 * 1024
    return toList(v).every((f) => f.size <= bytes) || (msg ?? `單檔不可超過 ${mb}MB`)
  }

  const atLeastOne =
    (msg = '請至少選一項') =>
    (v) =>
      (Array.isArray(v) && v.length > 0) || msg

  const emailRules = [
    (v) => !!v || 'Email 必填',
    (v) => /^\S+@\S+\.\S+$/.test(v) || 'Email 格式不正確',
  ]
  return {
    required,
    nonNegative,
    isMoney,
    codeFormat,
    percent0to100,
    discountLEPrice, // 使用時要 .value
    requiredFile, // 工廠，要呼叫
    fileTypes, // 工廠，要呼叫
    maxSizeMB, // 工廠，要呼叫
    atLeastOne,
    emailRules,
  }
}
