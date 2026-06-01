const merchantService = require('../../../services/merchant.service')

Page({
  data: {
    form: {
      storeName: '',
      contactName: '',
      contactPhone: '',
      storeIntro: ''
    }
  },

  onInput(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  async submit() {
    const result = await merchantService.applyMerchant(this.data.form)
    wx.showToast({ title: result.success ? '已提交' : result.message, icon: result.success ? 'success' : 'none' })
    if (result.success) wx.navigateTo({ url: '/pages/merchant/audit-status/audit-status' })
  }
})
