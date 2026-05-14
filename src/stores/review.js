import { defineStore } from 'pinia'
import api from '@/plugins/api'

export const useReviewStore = defineStore('review', {
  state: () => ({
    promotionCenterCount: 0,
    agentCount: 0,
  }),
  actions: {
    async fetchPendingCount() {
      try {
        this.loading = true
        const { data } = await api.get('/PromotionCenter/GetNoReviwCount')
        const res = await api.get('/Agent/GetNoReviwCount')

        this.promotionCenterCount = Number(data) || 0
        this.agentCount = Number(res.data) || 0
        this.error = null
      } catch (err) {
        console.log(err)
      } finally {
      }
    },
  },
})
