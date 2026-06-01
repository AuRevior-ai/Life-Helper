const promotionService = require('../../../services/promotion.service')
const { showError, showSuccess } = require('../../../utils/toast')

Page({
  data: {
    title: '优惠券编辑',
    couponTemplateId: '',
    form: {
      name: '',
      type: 'full_reduction',
      amount: 1000,
      threshold_amount: 10000,
      total_quantity: 100,
      per_user_limit: 1,
      valid_days_after_receive: 7,
      status: 'active'
    },
    submitting: false
  },

  onLoad(options = {}) {
    this.setData({ couponTemplateId: options.couponTemplateId || '' })
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  async submitForm() {
    this.setData({ submitting: true })
    try {
      const data = {
        ...this.data.form,
        amount: Number(this.data.form.amount || 0),
        threshold_amount: Number(this.data.form.threshold_amount || 0),
        total_quantity: Number(this.data.form.total_quantity || 0),
        per_user_limit: Number(this.data.form.per_user_limit || 1),
        valid_days_after_receive: Number(this.data.form.valid_days_after_receive || 7)
      }
      if (this.data.couponTemplateId) {
        await promotionService.adminUpdateCouponTemplate({
          couponTemplateId: this.data.couponTemplateId,
          ...data
        })
      } else {
        await promotionService.adminCreateCouponTemplate(data)
      }
      showSuccess('已保存')
      wx.navigateBack()
    } catch (error) {
      showError(error.message || '保存失败')
    } finally {
      this.setData({ submitting: false })
    }
  }
})

