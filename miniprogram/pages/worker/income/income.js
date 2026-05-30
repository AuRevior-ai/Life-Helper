const orderService = require('../../../services/order.service')
const { formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

Page({
  data: {
    title: '收入统计',
    completedCount: 0,
    totalAmountText: '¥0.00',
    orders: [],
    loading: true
  },

  onShow() {
    this.loadIncomeStats()
  },

  onPullDownRefresh() {
    this.loadIncomeStats().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadIncomeStats() {
    this.setData({ loading: true })
    try {
      const data = await orderService.getWorkerIncomeStats()
      this.setData({
        completedCount: data.completed_count || 0,
        totalAmountText: formatPrice(data.total_amount || 0),
        orders: (data.orders || []).map((order) => ({
          ...order,
          priceText: formatPrice(order.price)
        }))
      })
    } catch (error) {
      showError(error.message || '收入统计加载失败')
    } finally {
      this.setData({ loading: false })
    }
  }
})
