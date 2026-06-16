function stringifyData(data) {
  if (data === null || data === undefined) return ''
  if (typeof data === 'string') return data
  if (data instanceof Blob) return '伺服器傳回錯誤檔案，請稍後再試。'

  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function parseMoreInfo(moreInfo) {
  if (!moreInfo || typeof moreInfo !== 'string') return []

  return moreInfo
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [txSeq, ...messageParts] = item.split('|')
      return {
        txSeq: txSeq?.trim() || '',
        message: messageParts.join('|').trim() || item,
      }
    })
}

function parseEsunError(rawMessage, responseData) {
  const text = typeof rawMessage === 'string' ? rawMessage : ''
  const responseFromText = tryParseJson(text.match(/Response:\s*(\{[\s\S]*\})\s*$/)?.[1])
  const response = responseData?.rsStatus || responseData?.RsStatus ? responseData : responseFromText
  const rsHeader = response?.rsHeader || response?.RsHeader || {}
  const rsStatus = response?.rsStatus || response?.RsStatus || {}

  const code = rsStatus.code || rsStatus.Code || text.match(/ESUN Error:\s*([^,\n]+)/)?.[1]?.trim() || ''
  const bankMessage =
    rsStatus.message ||
    rsStatus.Message ||
    text.match(/Message:\s*([\s\S]*?)(?:,\s*MoreInfo:|,\s*Response:|$)/)?.[1]?.trim() ||
    ''
  const moreInfo =
    rsStatus.moreInfo ||
    rsStatus.MoreInfo ||
    text.match(/MoreInfo:\s*([\s\S]*?)(?:,\s*Response:|$)/)?.[1]?.trim() ||
    ''
  const items = parseMoreInfo(moreInfo)

  if (!code && !bankMessage && items.length === 0 && !/ESUN Error/i.test(text)) return null

  return {
    type: 'ESUN',
    code,
    bankMessage,
    moreInfo,
    items,
    msgId: rsHeader.msgId || rsHeader.MsgId || '',
    responseTime: rsHeader.responseTime || rsHeader.ResponseTime || '',
    rawMessage: text,
    rawResponse: response || null,
  }
}

function pickMessage(data) {
  if (!data) return { message: '', details: null }
  if (typeof data === 'string') {
    const details = parseEsunError(data)
    if (details) {
      const itemLines = details.items.map((item) => `${item.txSeq}：${item.message}`)
      return {
        message: [details.bankMessage || '玉山銀行交易失敗', ...itemLines].filter(Boolean).join('\n'),
        details,
      }
    }
    return { message: data, details: null }
  }

  const rsStatus = data.rsStatus || data.RsStatus
  const messages = [
    data.message,
    data.Message,
    data.error,
    data.Error,
    data.title,
    data.Title,
    rsStatus?.message,
    rsStatus?.Message,
    rsStatus?.moreInfo,
    rsStatus?.MoreInfo,
  ].filter(Boolean)
  const text = messages.join('\n')
  const details = parseEsunError(text, data)

  return {
    message: text,
    details,
  }
}

export function normalizeAxiosError(err) {
  if (err?.response) {
    const { status, data } = err.response
    const picked = pickMessage(data)
    const message = picked.message || stringifyData(data)
    const details = picked.details

    if (status === 401) return { kind: 'UNAUTHORIZED', status, message: message || '登入狀態已失效，請重新登入。', details }
    if (status === 403) return { kind: 'FORBIDDEN', status, message: message || '您沒有權限執行此操作。', details }
    if (status === 404) return { kind: 'NOT_FOUND', status, message: message || '找不到指定的資源。', details }
    if (status >= 500) return { kind: 'SERVER_ERROR', status, message: message || '伺服器發生錯誤，請稍後再試。', details }

    return {
      kind: 'CLIENT_ERROR',
      status,
      message: message || '請求發生錯誤。',
      details,
    }
  }

  if (err?.request) {
    if (err.code === 'ECONNABORTED') return { kind: 'TIMEOUT', message: '請求逾時，請稍後再試。' }

    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { kind: 'NETWORK_DOWN', message: '無法連線到伺服器，請確認網路或服務狀態。' }
    }

    return { kind: 'NO_RESPONSE', message: '伺服器沒有回應，請稍後再試。' }
  }

  return { kind: 'REQUEST_SETUP_ERROR', message: err?.message || '請求設定發生錯誤。' }
}
