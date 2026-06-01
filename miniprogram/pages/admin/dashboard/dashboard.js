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

  goAfterSales() {
    wx.navigateTo({ url: '/pages/admin/after-sale-list/after-sale-list' })
  },

  goAreas() {
    wx.navigateTo({ url: '/pages/admin/area-list/area-list' })
  },

  goDispatchLogs() {
    wx.navigateTo({ url: '/pages/admin/dispatch-logs/dispatch-logs' })
  },

  goFinanceLogs() {
    wx.navigateTo({ url: '/pages/admin/finance-log-list/finance-log-list' })
  },

  goWorkerEarnings() {
    wx.navigateTo({ url: '/pages/admin/worker-earning-list/worker-earning-list' })
  },

  goMemberPlans() {
    wx.navigateTo({ url: '/pages/admin/member-plan-list/member-plan-list' })
  },

  goCouponTemplates() {
    wx.navigateTo({ url: '/pages/admin/coupon-template-list/coupon-template-list' })
  },

  goReviews() {
    wx.navigateTo({ url: '/pages/admin/review-list/review-list' })
  },

  goReviewAppeals() {
    wx.navigateTo({ url: '/pages/admin/review-appeal-list/review-appeal-list' })
  },

  goTipLogs() {
    wx.navigateTo({ url: '/pages/admin/tip-log-list/tip-log-list' })
  },

  goServices() {
    wx.navigateTo({ url: '/pages/admin/service-list/service-list' })
  },

  goCategories() {
    wx.navigateTo({ url: '/pages/admin/category-list/category-list' })
  }
})
