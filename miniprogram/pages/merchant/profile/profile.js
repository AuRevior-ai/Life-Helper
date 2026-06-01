const merchantService = require('../../../services/merchant.service')

Page({
  data: { merchant: {} },
  onLoad() { this.loadMerchant() },
  async loadMerchant() {
    const result = await merchantService.getMyMerchantInfo()
    if (result.success) this.setData({ merchant: result.data.merchant || {} })
  },
  goServices() { wx.navigateTo({ url: '/pages/merchant/service-list/service-list' }) },
  goOrders() { wx.navigateTo({ url: '/pages/merchant/order-list/order-list' }) },
  goIncome() { wx.navigateTo({ url: '/pages/merchant/income/income' }) }
})
