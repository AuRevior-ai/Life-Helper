const refundService = require('../../../services/refund.service')
const { AFTER_SALE_STATUS_TEXT } = require('../../../config/status')
const { formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

function mapAfterSale(afterSale) {
  return {
    ...afterSale,
    statusText: AFTER_SALE_STATUS_TEXT[afterSale.status] || afterSale.status,
    amountText: formatPrice(afterSale.amount)
  }
}

Page({
  data: {
    title: '售后管理',
    afterSales: [],
    status: '',
    loading: true
  },

  onShow() {
    this.loadAfterSales()
  },

  async loadAfterSales() {
    this.setData({ loading: true })
    try {
      const data = await refundService.adminGetAfterSaleList({
        status: this.data.status
      })
      this.setData({
        afterSales: (data.afterSales || []).map(mapAfterSale)
      })
    } catch (error) {
      showError(error.message || '售后列表加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goDetail(event) {
    const afterSaleId = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/admin/after-sale-detail/after-sale-detail?afterSaleId=${afterSaleId}`
    })
  }
})
