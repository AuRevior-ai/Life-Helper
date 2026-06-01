const reviewService = require('../../../services/review.service')
const { showError } = require('../../../utils/toast')

Page({
  data: { title: '差评申诉', appeals: [], loading: true },
  onShow() { this.loadAppeals() },
  async loadAppeals() {
    try {
      const data = await reviewService.adminGetReviewAppealList()
      this.setData({ appeals: data.appeals || [] })
    } catch (error) { showError(error.message || '申诉加载失败') } finally { this.setData({ loading: false }) }
  },
  goDetail(event) {
    wx.navigateTo({ url: `/pages/admin/review-appeal-detail/review-appeal-detail?appealId=${event.currentTarget.dataset.id}` })
  }
})
