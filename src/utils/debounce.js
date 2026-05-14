// utils/debouncedAsync.js
export function useDebouncedAsync(fn, delay = 300) {
  let timer = null
  let callId = 0

  const debounced = (...args) =>
    new Promise((resolve, reject) => {
      clearTimeout(timer)
      const myId = ++callId

      timer = setTimeout(async () => {
        try {
          const result = await fn(...args)
          // ✅ 只接受最後一次呼叫
          if (myId === callId) resolve(result)
        } catch (err) {
          if (myId === callId) reject(err)
        }
      }, delay)
    })

  debounced.cancel = () => {
    clearTimeout(timer)
    callId++
  }

  return debounced
}
