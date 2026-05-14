import dayjs from 'dayjs'
import { computed } from 'vue'

export function useDateFormat(dateInput, format) {
  if (!dateInput) return computed(() => dayjs('9999-01-01').format(format))
  return computed(() => dayjs(dateInput).format(format))
}
