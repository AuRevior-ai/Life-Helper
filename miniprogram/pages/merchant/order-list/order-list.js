const merchantService = require('../../../services/merchant.service')

Page({
  data: { orders: [] },
  onLoad() { this.loadOrders() },
  async loadOrders() {
    const result = await merchantService.getMerchantOrderList()
    if (result.success) this.setData({ orders: result.data.list || [] })
  },
  goDetail(event) { wx.navigateTo({ url: `/pages/merchant/order-detail/order-detail?orderId=${event.currentTarget.dataset.id}` }) }
})
