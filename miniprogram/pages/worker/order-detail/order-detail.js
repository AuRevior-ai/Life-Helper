const orderService = require('../../../services/order.service')
const { formatOrderStatus, formatPayStatus, formatPrice } = require('../../../utils/format')
const { hideLoading, showError, showLoading, showSuccess } = require('../../../utils/toast')

Page({
  data: {
    title: '师傅订单详情',
    orderId: '',
    order: null,
    priceText: '¥0.00',
    statusText: '',
    payStatusText: '',
    canStart: false,
    canFinish: false,
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
      const order = data.order
      this.setData({
        order,
        priceText: formatPrice(order.price),
        statusText: formatOrderStatus(order.status),
        payStatusText: formatPayStatus(order.pay_status),
        canStart: order.status === 'accepted',
        canFinish: order.status === 'serving'
      })
    } catch (error) {
      showError(error.message || '订单详情加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async startService() {
    this.setData({ submitting: true })
    showLoading('开始服务')
    try {
      const data = await orderService.startService({
        orderId: this.data.orderId
      })
      this.applyOrder(data.order)
      showSuccess('已开始服务')
    } catch (error) {
      showError(error.message || '操作失败')
    } finally {
      hideLoading()
      this.setData({ submitting: false })
    }
  },

  async finishService() {
    this.setData({ submitting: true })
    showLoading('完成服务')
    try {
      const data = await orderService.finishService({
        orderId: this.data.orderId
      })
      this.applyOrder(data.order)
      showSuccess('已提交验收')
    } catch (error) {
      showError(error.message || '操作失败')
    } finally {
      hideLoading()
      this.setData({ submitting: false })
    }
  },

  applyOrder(order) {
    this.setData({
      order,
      priceText: formatPrice(order.price),
      statusText: formatOrderStatus(order.status),
      payStatusText: formatPayStatus(order.pay_status),
      canStart: order.status === 'accepted',
      canFinish: order.status === 'serving'
    })
  }
})
