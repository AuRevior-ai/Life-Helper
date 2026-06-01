const merchantService = require('../../../services/merchant.service')

Page({
  data: {
    auditStatus: '',
    merchant: {}
  },

  onLoad() {
    this.loadStatus()
  },

  async loadStatus() {
    const result = await merchantService.getMerchantAuditStatus()
    if (result.success) {
      this.setData({ auditStatus: result.data.audit_status, merchant: result.data.merchant || {} })
    }
  }
})
