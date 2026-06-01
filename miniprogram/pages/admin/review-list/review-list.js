const reviewService = require('../../../services/review.service')
const { showError } = require('../../../utils/toast')

Page({
  data: { title: '评价管理', reviews: [], loading: true },
  onShow() { this.loadReviews() },
  async loadReviews() {
    try {
      const data = await reviewService.adminGetReviewList()
      this.setData({ reviews: data.reviews || [] })
    } catch (error) { showError(error.message || '评价加载失败') } finally { this.setData({ loading: false }) }
  },
  goDetail(event) {
    wx.navigateTo({ url: `/pages/admin/review-detail/review-detail?reviewId=${event.currentTarget.dataset.id}` })
  }
})
