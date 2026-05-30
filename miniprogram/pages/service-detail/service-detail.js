const serviceService = require('../../services/service.service')
const { formatPrice } = require('../../utils/format')
const { showError, showToast } = require('../../utils/toast')

Page({
  data: {
    title: '服务详情',
    serviceId: '',
    service: null,
    priceText: '¥0.00',
    loading: true
  },

  onLoad(options = {}) {
    this.setData({
      serviceId: options.serviceId || ''
    })
    this.loadServiceDetail()
  },

  async loadServiceDetail() {
    if (!this.data.serviceId) {
      this.setData({ loading: false })
      showError('缺少服务 ID')
      return
    }

    this.setData({ loading: true })
    try {
      const data = await serviceService.getServiceDetail({
        serviceId: this.data.serviceId
      })
      const service = data.service
      this.setData({
        service,
        title: service.name,
        priceText: formatPrice(service.price)
      })
      wx.setNavigationBarTitle({
        title: service.name
      })
    } catch (error) {
      showError(error.message || '服务详情加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goSubmitOrder() {
    showToast('下单功能将在阶段四开放')
  }
})
