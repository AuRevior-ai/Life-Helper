const merchantService = require('../../../services/merchant.service')
const { showError, showSuccess } = require('../../../utils/toast')

Page({
  data: { orderId: '', order: {}, finishRemark: '' },
  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || '' })
    this.loadOrder()
  },

  async loadOrder() {
    try {
      const data = await merchantService.getMerchantOrderDetail({ orderId: this.data.orderId })
      this.setData({ order: data.order || {} })
    } catch (error) {
      showError(error.message || '订单加载失败')
    }
  },

  onRemarkInput(event) { this.setData({ finishRemark: event.detail.value }) },

  async accept() {
    try {
      await merchantService.merchantAcceptOrder({ orderId: this.data.orderId })
      showSuccess('商家接单成功')
      await this.loadOrder()
    } catch (error) {
      showError(error.message || '操作失败')
    }
  },

  async start() {
    try {
      await merchantService.merchantStartService({ orderId: this.data.orderId })
      showSuccess('商家服务已开始')
      await this.loadOrder()
    } catch (error) {
      showError(error.message || '操作失败')
    }
  },

  async finish() {
    try {
      await merchantService.merchantFinishService({ orderId: this.data.orderId, finishRemark: this.data.finishRemark })
      showSuccess('商家完工已提交')
      await this.loadOrder()
    } catch (error) {
      showError(error.message || '操作失败')
    }
  }
})
