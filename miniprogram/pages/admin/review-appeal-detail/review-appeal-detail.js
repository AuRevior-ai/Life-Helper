const reviewService = require('../../../services/review.service')
const { hideLoading, showError, showLoading, showSuccess } = require('../../../utils/toast')

Page({
  data: { title: '申诉详情', appealId: '', appeal: null, adminRemark: '', submitting: false },
  onLoad(options = {}) { this.setData({ appealId: options.appealId || '' }); this.loadAppeal() },

  async loadAppeal() {
    try {
      const data = await reviewService.adminGetReviewAppealDetail({ appealId: this.data.appealId })
      this.setData({ appeal: data.appeal })
    } catch (error) { showError(error.message || '申诉加载失败') }
  },

  onRemarkInput(event) { this.setData({ adminRemark: event.detail.value }) },

  async reviewAppeal(event) {
    const result = event.currentTarget.dataset.result
    this.setData({ submitting: true })
    showLoading('处理中')
    try {
      await reviewService.adminReviewAppeal({
        appealId: this.data.appealId,
        result,
        adminRemark: this.data.adminRemark
      })
      hideLoading()
      if (result === 'approved') {
        showSuccess('申诉审核已通过')
      } else {
        showSuccess('申诉审核已拒绝')
      }
      setTimeout(() => {
        wx.navigateBack()
      }, 600)
    } catch (error) {
      hideLoading()
      showError(error.message || '处理失败')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
