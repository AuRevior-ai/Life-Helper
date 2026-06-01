const merchantService = require('../../../services/merchant.service')

Page({
  data: { services: [] },
  onLoad() { this.loadServices() },
  async loadServices() {
    const result = await merchantService.getMerchantServiceList()
    if (result.success) this.setData({ services: result.data.list || [] })
  },
  goCreate() { wx.navigateTo({ url: '/pages/merchant/service-edit/service-edit' }) }
})
