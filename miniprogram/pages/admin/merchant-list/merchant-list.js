const merchantService = require('../../../services/merchant.service')

Page({
  data: { merchants: [] },
  onLoad() { this.loadMerchants() },
  async loadMerchants() {
    const result = await merchantService.adminGetMerchantList()
    if (result.success) this.setData({ merchants: result.data.list || [] })
  },
  goDetail(event) { wx.navigateTo({ url: `/pages/admin/merchant-detail/merchant-detail?merchantId=${event.currentTarget.dataset.id}` }) }
})
