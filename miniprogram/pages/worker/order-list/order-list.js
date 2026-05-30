const orderService = require('../../../services/order.service')
const { showError } = require('../../../utils/toast')

Page({
  data: {
    title: '师傅订单',
    orders: [],
    loading: true
  },

  onShow() {
    this.loadWorkerOrders()
  },

  onPullDownRefresh() {
    this.loadWorkerOrders().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadWorkerOrders() {
    this.setData({ loading: true })
    try {
      const data = await orderService.getWorkerOrderList()
      this.setData({
        orders: data.orders || []
      })
    } catch (error) {
      showError(error.message || '师傅订单加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goOrderDetail(event) {
    const order = event.detail || {}
    wx.navigateTo({
      url: `/pages/worker/order-detail/order-detail?orderId=${order._id}`
    })
  },

  goOrderHall() {
    wx.navigateTo({
      url: '/pages/worker/order-hall/order-hall'
    })
  }
})
