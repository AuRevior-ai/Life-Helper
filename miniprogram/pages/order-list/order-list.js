const orderService = require('../../services/order.service')
const { showError } = require('../../utils/toast')

Page({
  data: {
    title: '我的订单',
    orders: [],
    loading: true
  },

  onShow() {
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.loadOrders().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadOrders() {
    this.setData({ loading: true })
    try {
      const data = await orderService.getUserOrderList()
      this.setData({
        orders: data.orders || []
      })
    } catch (error) {
      showError(error.message || '订单加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goOrderDetail(event) {
    const order = event.detail || {}
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${order._id}`
    })
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
