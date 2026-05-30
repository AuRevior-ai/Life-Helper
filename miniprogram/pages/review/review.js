const reviewService = require('../../services/review.service')
const { hideLoading, showError, showLoading, showSuccess } = require('../../utils/toast')

Page({
  data: {
    title: '订单评价',
    orderId: '',
    rating: 5,
    content: '',
    submitting: false,
    ratingOptions: [1, 2, 3, 4, 5]
  },

  onLoad(options = {}) {
    this.setData({
      orderId: options.orderId || ''
    })
  },

  selectRating(event) {
    this.setData({
      rating: Number(event.currentTarget.dataset.rating)
    })
  },

  handleContentInput(event) {
    this.setData({
      content: event.detail.value
    })
  },

  async handleSubmit() {
    if (!this.data.orderId) {
      showError('缺少订单 ID')
      return
    }

    this.setData({ submitting: true })
    showLoading('提交评价')
    try {
      await reviewService.createReview({
        orderId: this.data.orderId,
        rating: this.data.rating,
        content: this.data.content
      })
      showSuccess('评价成功')
      wx.redirectTo({
        url: `/pages/order-detail/order-detail?orderId=${this.data.orderId}`
      })
    } catch (error) {
      showError(error.message || '评价失败')
    } finally {
      hideLoading()
      this.setData({ submitting: false })
    }
  }
})
