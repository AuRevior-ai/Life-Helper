const merchantService = require('../../../services/merchant.service')
const { showError } = require('../../../utils/toast')

Page({
  data: { services: [] },
  onLoad() { this.loadServices() },

  async loadServices() {
    try {
      const data = await merchantService.getMerchantServiceList()
      this.setData({ services: data.list || [] })
    } catch (error) {
      showError(error.message || '商家服务加载失败')
    }
  },

  goCreate() { wx.navigateTo({ url: '/pages/merchant/service-edit/service-edit' }) }
})
