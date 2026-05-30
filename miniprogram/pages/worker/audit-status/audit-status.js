const workerService = require('../../../services/worker.service')
const { formatWorkerAuditStatus } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

Page({
  data: {
    title: '审核状态',
    worker: null,
    auditStatus: 'not_applied',
    auditStatusText: '未申请',
    loading: true,
    isApproved: false,
    isRejected: false,
    isNotApplied: false
  },

  onShow() {
    this.loadAuditStatus()
  },

  async loadAuditStatus() {
    this.setData({ loading: true })
    try {
      const data = await workerService.getAuditStatus()
      const auditStatus = data.audit_status || 'not_applied'
      this.setData({
        worker: data.worker || null,
        auditStatus,
        auditStatusText: auditStatus === 'not_applied' ? '未申请' : formatWorkerAuditStatus(auditStatus),
        isApproved: auditStatus === 'approved',
        isRejected: auditStatus === 'rejected',
        isNotApplied: auditStatus === 'not_applied'
      })
    } catch (error) {
      showError(error.message || '状态加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goApply() {
    wx.redirectTo({
      url: '/pages/worker/apply/apply'
    })
  },

  goOrderHall() {
    wx.navigateTo({
      url: '/pages/worker/order-hall/order-hall'
    })
  },

  goWorkerOrders() {
    wx.navigateTo({
      url: '/pages/worker/order-list/order-list'
    })
  }
})
