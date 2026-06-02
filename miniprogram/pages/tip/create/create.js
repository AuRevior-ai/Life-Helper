const tipService = require('../../../services/tip.service')
const { formatPrice } = require('../../../utils/format')
const { hideLoading, showError, showLoading, showSuccess } = require('../../../utils/toast')

Page({
  data: {
    title: '打赏师傅',
    orderId: '',
    amountOptions: [200, 500, 1000, 2000],
    amountIndex: 1,
    customAmount: '',
    amountText: '¥5.00',
    submitting: false
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || '' })
  },

  chooseAmount(event) {
    const amountIndex = Number(event.detail.value || 0)
    this.setData({
      amountIndex,
      customAmount: '',
      amountText: formatPrice(this.data.amountOptions[amountIndex])
    })
  },

  onCustomInput(event) {
    this.setData({ customAmount: event.detail.value })
  },

  getAmount() {
    if (this.data.customAmount) return Math.round(Number(this.data.customAmount) * 100)
    return this.data.amountOptions[this.data.amountIndex]
  },

  async submit() {
    this.setData({ submitting: true })
    showLoading('提交中')
    try {
      await tipService.createMockTip({ orderId: this.data.orderId, amount: this.getAmount() })
      hideLoading()
      this.setData({ submitting: false })
      showSuccess('模拟打赏成功')
      setTimeout(() => {
        wx.navigateBack()
      }, 600)
    } catch (error) {
      hideLoading()
      showError(error.message || '打赏失败')
      this.setData({ submitting: false })
    }
  }
})
