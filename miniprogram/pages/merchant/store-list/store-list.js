const merchantService = require('../../../services/merchant.service')
const { showError } = require('../../../utils/toast')

Page({
  data: {
    stores: []
  },

  onLoad() {
    this.loadStores()
  },

  async loadStores() {
    try {
      const data = await merchantService.getStoreList()
      this.setData({ stores: data.list || [] })
    } catch (error) {
      showError(error.message || '商家列表加载失败')
    }
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/merchant/store-detail/store-detail?merchantId=${id}` })
  }
})
