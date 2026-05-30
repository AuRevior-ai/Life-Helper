const orderService = require('../../../services/order.service')
const workerService = require('../../../services/worker.service')
const { formatPrice } = require('../../../utils/format')
const { hideLoading, showError, showLoading, showSuccess } = require('../../../utils/toast')

Page({
  data: {
    title: '接单大厅',
    orders: [],
    loading: true,
    submittingId: ''
  },

  onShow() {
    this.loadOrderHall()
  },

  onPullDownRefresh() {
    this.loadOrderHall().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadOrderHall() {
    this.setData({ loading: true })
    try {
      const data = await workerService.getOrderHallList()
      this.setData({
        orders: (data.orders || []).map((order) => ({
          ...order,
          priceText: formatPrice(order.price)
        }))
      })
    } catch (error) {
      showError(error.message || '接单大厅加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async acceptOrder(event) {
    const orderId = event.currentTarget.dataset.id
    this.setData({ submittingId: orderId })
    showLoading('接单中')
    try {
      const data = await orderService.acceptOrder({ orderId })
      showSuccess('接单成功')
      wx.navigateTo({
        url: `/pages/worker/order-detail/order-detail?orderId=${data.order._id}`
      })
    } catch (error) {
      showError(error.message || '接单失败')
    } finally {
      hideLoading()
      this.setData({ submittingId: '' })
    }
  },

  goWorkerOrders() {
    wx.navigateTo({
      url: '/pages/worker/order-list/order-list'
    })
  }
})
