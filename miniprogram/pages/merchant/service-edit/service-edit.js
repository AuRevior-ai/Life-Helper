const merchantService = require('../../../services/merchant.service')

Page({
  data: { form: { serviceId: '', price: '' } },
  onInput(event) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }) },
  async submit() {
    const result = await merchantService.createMerchantService(this.data.form)
    wx.showToast({ title: result.success ? '已保存' : result.message, icon: result.success ? 'success' : 'none' })
    if (result.success) wx.navigateBack()
  }
})
