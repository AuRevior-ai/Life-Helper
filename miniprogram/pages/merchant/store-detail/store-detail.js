const merchantService = require('../../../services/merchant.service')
const { formatPrice } = require('../../../utils/format')

Page({
  data: {
    merchantId: '',
    merchant: {},
    services: []
  },

  onLoad(options = {}) {
    this.setData({ merchantId: options.merchantId || '' })
    this.loadDetail()
  },

  async loadDetail() {
    const result = await merchantService.getStoreDetail({ merchantId: this.data.merchantId })
    if (result.success) {
      const services = (result.data.services || []).map((item) => ({
        ...item,
        priceText: formatPrice(item.price).replace('¥', '')
      }))
      this.setData({ merchant: result.data.merchant, services })
    }
  },

  goOrder(event) {
    const merchantServiceId = event.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order-submit/order-submit?merchantServiceId=${merchantServiceId}` })
  }
})
