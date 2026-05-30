const orderService = require('../../../services/order.service')
const { formatOrderStatus, formatPayStatus, formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

Page({
  data: {
    title: '师傅订单详情',
    orderId: '',
    order: null,
    priceText: '¥0.00',
    statusText: '',
    payStatusText: '',
    loading: true
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
      const order = data.order
      this.setData({
        order,
        priceText: formatPrice(order.price),
        statusText: formatOrderStatus(order.status),
        payStatusText: formatPayStatus(order.pay_status)
      })
    } catch (error) {
      showError(error.message || '订单详情加载失败')
    } finally {
      this.setData({ loading: false })
    }
  }
})
