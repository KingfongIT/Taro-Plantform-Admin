<template>
  <v-card border class="pa-4" height="300">
    <v-card-title class="text-h6">{{ props.chartTitle }}</v-card-title>
    <div v-if="props.loading" class="d-flex align-center justify-center" style="height: 210px">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <ApexCharts
      v-else-if="props.series.length > 0"
      type="donut"
      height="210"
      :options="chartOptions"
      :series="props.series"
    />
    <div v-else class="d-flex align-center justify-center" style="height: 210px">
      <v-icon size="48" color="grey">mdi-chart-donut</v-icon>
    </div>
  </v-card>
</template>

<script setup>
import ApexCharts from 'vue3-apexcharts'
import { computed } from 'vue'

// 從父元件傳過來的資料
const props = defineProps({
  chartTitle: String,
  donutOption: {
    type: Object,
    required: true,
    default: () => ({
      items: [],
      //   labels: [],
    }),
  },
  series: {
    type: Array,
    required: true,
  },
  labels: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
  },
  colors: ['#1976D2', '#FF5252', '#82B1FF', '#4CAF50', '#FB8C00', '#B0BEC5'],
  labels: props.labels,
  legend: {
    show: true,
    position: 'right',
    horizontalAlign: 'center',
    itemMargin: {
      vertical: 6,
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '16px',
            color: '#999',
            offsetY: -10,
          },
          value: {
            show: true,
            fontSize: '20px',
            fontWeight: 600,
            color: '#333',
            offsetY: 10,
          },
          total: {
            show: true,
            label: '會員總數',
            fontSize: '16px',
            fontWeight: 500,
            color: '#444',
            formatter: () => props.donutOption.items?.length.toString() ?? '0',
          },
        },
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
}))
</script>
