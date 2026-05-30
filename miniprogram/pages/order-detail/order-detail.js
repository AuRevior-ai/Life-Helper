const orderService = require('../../services/order.service')
const {
  formatOrderStatus,
  formatPayStatus,
  formatPrice
} = require('../../utils/format')
const { hideLoading, showError, showLoading, showSuccess } = require('../../utils/toast')

Page({
  data: {
    title: '订单详情',
    orderId: '',
    order: null,
    priceText: '¥0.00',
    statusText: '',
    payStatusText: '',
    canPay: false,
    canCancel: false,
    loading: true,
    submitting: false
  },

  onLoad(options = {}) {
    this.setData({
      orderId: options.orderId || ''
    })
    this.loadOrderDetail()
  },

  async loadOrderDetail() {
    if (!this.data.orderId) {
      this.setData({ loading: false })
      showError('缺少订单 ID')
      return
    }

    this.setData({ loading: true })
    try {
      const data = await orderService.getOrderDetail({
        orderId: this.data.orderId
      })
      this.applyOrder(data.order)
    } catch (error) {
      showError(error.message || '订单加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  applyOrder(order) {
    this.setData({
      order,
      priceText: formatPrice(order.price),
      statusText: formatOrderStatus(order.status),
      payStatusText: formatPayStatus(order.pay_status),
      canPay: order.status === 'pending_pay' && order.pay_status === 'unpaid',
      canCancel: ['pending_pay', 'pending_accept'].includes(order.status)
    })
  },

  async handleMockPay() {
    this.setData({ submitting: true })
    showLoading('支付中')
    try {
      const data = await orderService.mockPayOrder({
        orderId: this.data.orderId
      })
      this.applyOrder(data.order)
      showSuccess('支付成功')
    } catch (error) {
      showError(error.message || '支付失败')
    } finally {
      hideLoading()
      this.setData({ submitting: false })
    }
  },

  handleCancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '确认取消这个订单吗？',
      confirmColor: '#c66b2d',
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ submitting: true })
        try {
          const data = await orderService.cancelOrder({
            orderId: this.data.orderId
          })
          this.applyOrder(data.order)
          showSuccess('订单已取消')
        } catch (error) {
          showError(error.message || '取消失败')
        } finally {
          this.setData({ submitting: false })
        }
      }
    })
  }
})
