const merchantService = require('../../../services/merchant.service')

Page({
  data: { orderId: '', order: {}, finishRemark: '' },
  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || '' })
    this.loadOrder()
  },
  async loadOrder() {
    const result = await merchantService.getMerchantOrderDetail({ orderId: this.data.orderId })
    if (result.success) this.setData({ order: result.data.order })
  },
  onRemarkInput(event) { this.setData({ finishRemark: event.detail.value }) },
  async accept() { await merchantService.merchantAcceptOrder({ orderId: this.data.orderId }); this.loadOrder() },
  async start() { await merchantService.merchantStartService({ orderId: this.data.orderId }); this.loadOrder() },
  async finish() {
    await merchantService.merchantFinishService({ orderId: this.data.orderId, finishRemark: this.data.finishRemark })
    this.loadOrder()
  }
})
