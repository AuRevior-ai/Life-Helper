const merchantService = require('../../../services/merchant.service')

Page({
  data: {
    stores: []
  },

  onLoad() {
    this.loadStores()
  },

  async loadStores() {
    const result = await merchantService.getStoreList()
    if (result.success) {
      this.setData({ stores: result.data.list || [] })
    }
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/merchant/store-detail/store-detail?merchantId=${id}` })
  }
})
