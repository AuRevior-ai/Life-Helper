const orderService = require('../../services/order.service')
const paymentService = require('../../services/payment.service')
const { formatPrice } = require('../../utils/format')
const { showError } = require('../../utils/toast')

Page({
  data: {
    title: '支付结果',
    orderId: '',
    order: null,
    state: 'processing',
    stateText: '支付处理中',
    description: '正在向后端确认支付结果，请稍候刷新订单状态。',
    priceText: '¥0.00',
    loading: true
  },

  onLoad(options = {}) {
    this.setData({
      orderId: options.orderId || ''
    })
    this.loadPaymentResult()
  },

  async loadPaymentResult() {
    if (!this.data.orderId) {
      this.setData({ loading: false })
      showError('缺少订单 ID')
      return
    }

    this.setData({ loading: true })
    try {
      await paymentService.queryPaymentStatus({
        orderId: this.data.orderId
      })
      const data = await orderService.getOrderDetail({
        orderId: this.data.orderId
      })
      this.applyOrder(data.order)
    } catch (error) {
      showError(error.message || '支付结果加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  applyOrder(order) {
    const paid = order.pay_status === 'paid' && order.status === 'pending_accept'
    const failed = order.pay_status === 'failed'
    this.setData({
      order,
      priceText: formatPrice(order.price),
      state: paid ? 'success' : failed ? 'failed' : 'processing',
      stateText: paid ? '支付成功' : failed ? '支付失败' : '支付处理中',
      description: paid
        ? '订单已提交，正在等待师傅接单。'
        : failed
          ? order.pay_error || '支付未完成，可返回订单详情重新支付。'
          : '支付结果以后端回调确认为准，稍后可刷新查看。'
    })
  },

  refreshResult() {
    this.loadPaymentResult()
  },

  goOrderDetail() {
    wx.redirectTo({
      url: `/pages/order-detail/order-detail?orderId=${this.data.orderId}`
    })
  },

  goOrderList() {
    wx.switchTab({
      url: '/pages/order-list/order-list'
    })
  }
})
