const merchantService = require('../../../services/merchant.service')
const { showError } = require('../../../utils/toast')

Page({
  data: { merchant: {} },
  onLoad() { this.loadMerchant() },

  async loadMerchant() {
    try {
      const data = await merchantService.getMyMerchantInfo()
      this.setData({ merchant: data.merchant || {} })
    } catch (error) {
      showError(error.message || '商家信息加载失败')
    }
  },

  goServices() { wx.navigateTo({ url: '/pages/merchant/service-list/service-list' }) },
  goOrders() { wx.navigateTo({ url: '/pages/merchant/order-list/order-list' }) },
  goIncome() { wx.navigateTo({ url: '/pages/merchant/income/income' }) },
  goQualification() { wx.navigateTo({ url: '/pages/merchant/qualification/qualification' }) },
  goDeposit() { wx.navigateTo({ url: '/pages/merchant/deposit/deposit' }) },
  goRiskStatus() { wx.navigateTo({ url: '/pages/merchant/risk-status/risk-status' }) }
})
