const merchantService = require('../../../services/merchant.service')

Page({
  data: { merchantId: '', merchant: {} },
  onLoad(options = {}) {
    this.setData({ merchantId: options.merchantId || '' })
    this.loadDetail()
  },
  async loadDetail() {
    const result = await merchantService.adminGetMerchantDetail({ merchantId: this.data.merchantId })
    if (result.success) this.setData({ merchant: result.data.merchant })
  },
  async approve() { await merchantService.adminApproveMerchant({ merchantId: this.data.merchantId }); this.loadDetail() },
  async reject() { await merchantService.adminRejectMerchant({ merchantId: this.data.merchantId, reason: '资料不完整' }); this.loadDetail() },
  async enable() { await merchantService.adminEnableMerchant({ merchantId: this.data.merchantId }); this.loadDetail() },
  async disable() { await merchantService.adminDisableMerchant({ merchantId: this.data.merchantId }); this.loadDetail() }
})
