const adminService = require('../../../services/admin.service')
const { formatOrderStatus, formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

function mapOrder(order) {
  return {
    ...order,
    statusText: formatOrderStatus(order.status),
    priceText: formatPrice(order.price)
  }
}

Page({
  data: {
    title: '订单管理',
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
      const data = await adminService.getAllOrders()
      this.setData({
        orders: (data.orders || []).map(mapOrder)
      })
    } catch (error) {
      showError(error.message || '订单加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goDetail(event) {
    const orderId = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/admin/order-detail/order-detail?orderId=${orderId}`
    })
  }
})
