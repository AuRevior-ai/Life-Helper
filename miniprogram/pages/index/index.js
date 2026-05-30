const serviceService = require('../../services/service.service')
const { showError } = require('../../utils/toast')

Page({
  data: {
    title: '首页',
    loading: true,
    categories: [],
    recommendedServices: []
  },

  onLoad() {
    this.loadHomeData()
  },

  async loadHomeData() {
    this.setData({ loading: true })
    try {
      const [categoryData, serviceData] = await Promise.all([
        serviceService.getCategoryList(),
        serviceService.getServiceList({ recommended: true })
      ])

      this.setData({
        categories: categoryData.categories || [],
        recommendedServices: serviceData.services || []
      })
    } catch (error) {
      showError(error.message || '首页数据加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goServiceList(event) {
    const categoryId = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/service-list/service-list?categoryId=${categoryId}`
    })
  },

  goServiceDetail(event) {
    const serviceId = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?serviceId=${serviceId}`
    })
  }
})
