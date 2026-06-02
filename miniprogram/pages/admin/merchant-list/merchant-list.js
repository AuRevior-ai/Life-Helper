const merchantService = require('../../../services/merchant.service')
const { showError } = require('../../../utils/toast')

Page({
  data: { merchants: [] },
  onLoad() { this.loadMerchants() },

  async loadMerchants() {
    try {
      const data = await merchantService.adminGetMerchantList()
      this.setData({ merchants: data.list || [] })
    } catch (error) {
      showError(error.message || '商家列表加载失败')
    }
  },

  goDetail(event) { wx.navigateTo({ url: `/pages/admin/merchant-detail/merchant-detail?merchantId=${event.currentTarget.dataset.id}` }) }
})
