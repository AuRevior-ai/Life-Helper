const adminService = require('../../../services/admin.service')
const { formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

Page({
  data: {
    title: '管理首页',
    loading: true,
    stats: {
      user_count: 0,
      order_count: 0,
      pending_worker_count: 0,
      completed_order_amount: 0
    },
    completedOrderAmountText: formatPrice(0)
  },

  onShow() {
    this.loadDashboard()
  },

  onPullDownRefresh() {
    this.loadDashboard().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadDashboard() {
    this.setData({ loading: true })
    try {
      const data = await adminService.getDashboard()
      const stats = data.stats || {}
      this.setData({
        stats,
        completedOrderAmountText: formatPrice(stats.completed_order_amount)
      })
    } catch (error) {
      showError(error.message || '看板加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/admin/order-list/order-list' })
  },

  goUsers() {
    wx.navigateTo({ url: '/pages/admin/user-list/user-list' })
  },

  goWorkers() {
    wx.navigateTo({ url: '/pages/admin/worker-audit/worker-audit' })
  },

  goServices() {
    wx.navigateTo({ url: '/pages/admin/service-list/service-list' })
  },

  goCategories() {
    wx.navigateTo({ url: '/pages/admin/category-list/category-list' })
  }
})
