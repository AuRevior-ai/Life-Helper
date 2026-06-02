const reviewService = require('../../../services/review.service')
const { showError } = require('../../../utils/toast')

function getWorkerName(appeal = {}) {
  return appeal.worker_name || appeal.worker_nickname || appeal.worker_id || '未分配师傅'
}

function groupAppealsByWorker(appeals = []) {
  const groups = []
  const groupMap = {}
  for (const appeal of appeals) {
    const workerId = appeal.worker_id || 'unknown'
    if (!groupMap[workerId]) {
      groupMap[workerId] = {
        workerId,
        workerName: getWorkerName(appeal),
        appeals: []
      }
      groups.push(groupMap[workerId])
    }
    groupMap[workerId].appeals.push(appeal)
  }
  return groups
}

Page({
  data: { title: '差评申诉', appeals: [], groupedAppeals: [], loading: true },

  onShow() { this.loadAppeals() },

  async loadAppeals() {
    this.setData({ loading: true })
    try {
      const data = await reviewService.adminGetReviewAppealList()
      const appeals = data.appeals || []
      this.setData({
        appeals,
        groupedAppeals: groupAppealsByWorker(appeals)
      })
    } catch (error) { showError(error.message || '申诉加载失败') } finally { this.setData({ loading: false }) }
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/admin/review-appeal-detail/review-appeal-detail?appealId=${event.currentTarget.dataset.id}` })
  }
})
