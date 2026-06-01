const reviewService = require('../../../services/review.service')
const { hideLoading, showError, showLoading, showSuccess } = require('../../../utils/toast')

Page({
  data: { title: '评价详情', reviewId: '', review: null, reason: '', submitting: false },
  onLoad(options = {}) { this.setData({ reviewId: options.reviewId || '' }); this.loadReview() },
  async loadReview() {
    try {
      const data = await reviewService.adminGetReviewDetail({ reviewId: this.data.reviewId })
      this.setData({ review: data.review })
    } catch (error) { showError(error.message || '评价加载失败') }
  },
  onReasonInput(event) { this.setData({ reason: event.detail.value }) },
  async hideReview() {
    this.setData({ submitting: true }); showLoading('处理中')
    try {
      await reviewService.adminHideReview({ reviewId: this.data.reviewId, reason: this.data.reason })
      showSuccess('已隐藏'); this.loadReview()
    } catch (error) { showError(error.message || '隐藏失败') } finally { hideLoading(); this.setData({ submitting: false }) }
  },
  async restoreReview() {
    this.setData({ submitting: true }); showLoading('处理中')
    try {
      await reviewService.adminRestoreReview({ reviewId: this.data.reviewId, reason: this.data.reason })
      showSuccess('已恢复'); this.loadReview()
    } catch (error) { showError(error.message || '恢复失败') } finally { hideLoading(); this.setData({ submitting: false }) }
  }
})
