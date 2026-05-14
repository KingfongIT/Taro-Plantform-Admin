<template>
  <v-card class="pa-4" height="300">
    <div class="d-flex justify-space-between align-center mb-2">
      <span class="text-h6">註冊人數</span>
      <div>
        <v-select
          v-model="selectedRange"
          :items="rangeOptions"
          item-title="text"
          item-value="value"
          flat
          variant="solo-filled"
          density="compact"
          hide-details
        />
      </div>
    </div>
    <ApexCharts height="215" type="line" :options="chartOptions" :series="series" />
  </v-card>
</template>

<script setup>
import ApexCharts from 'vue3-apexcharts'
import { ref, computed } from 'vue'

const props = defineProps({
  // list: [{ createdDate: '2025-06-18T10:23:00Z', ... }]
  list: { type: Array, default: () => [] },
})

const today = new Date()

function getMonthsAgo(monthsAgo) {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  // 正常化到本地「當天 00:00:00」避免 off-by-one
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// 以「本地年月日」建立 key: YYYY-MM-DD
function toLocalYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ▼ 近 1 個月（按日）
const oneMonthData = computed(() => {
  const fromDate = getMonthsAgo(1)
  const counts = Object.create(null)

  for (const member of props.list) {
    if (!member?.createdDate) continue
    const d = new Date(member.createdDate)
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (local >= fromDate) {
      const key = toLocalYMD(local)
      counts[key] = (counts[key] || 0) + 1
    }
  }

  const categories = []
  const values = []
  const cur = new Date(fromDate)

  while (cur <= today) {
    const key = toLocalYMD(cur)
    categories.push(`${cur.getMonth() + 1}/${cur.getDate()}`) // 顯示 MM/DD
    values.push(counts[key] || 0)
    cur.setDate(cur.getDate() + 1)
  }

  return { categories, series: values }
})

// ▼ 近 N 個月（按月）
function getMonthlyData(months) {
  const fromDate = getMonthsAgo(months)
  const counts = Object.create(null)

  for (const member of props.list) {
    if (!member?.createdDate) continue
    const d = new Date(member.createdDate)
    if (d >= fromDate) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      counts[key] = (counts[key] || 0) + 1
    }
  }

  const categories = []
  const values = []
  const cur = new Date(fromDate)
  cur.setDate(1) // 對齊每月第一天

  while (cur <= today) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
    categories.push(key)
    values.push(counts[key] || 0)
    cur.setMonth(cur.getMonth() + 1)
  }

  return { categories, series: values }
}

const sixMonthData = computed(() => getMonthlyData(6))
const oneYearData = computed(() => getMonthlyData(12))

// ▼ 使用者可選的時間範圍
const selectedRange = ref('1m')
const rangeOptions = [
  { text: '近 1 個月', value: '1m' },
  { text: '近半年', value: '6m' },
  { text: '近一年', value: '1y' },
]

// ▼ 根據範圍顯示資料
const currentChartData = computed(() => {
  if (selectedRange.value === '1m') return oneMonthData.value
  if (selectedRange.value === '6m') return sixMonthData.value
  return oneYearData.value
})

// ▼ 對應 computed 的 series & categories
const series = computed(() => [{ name: '註冊會員', data: currentChartData.value.series }])

const chartOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false } },
  xaxis: { categories: currentChartData.value.categories },
  stroke: { curve: 'straight' },
  markers: { size: 5, hover: { size: 7 } },
  tooltip: { enabled: true, y: { formatter: (val) => `${val} 位` } },
}))
</script>
