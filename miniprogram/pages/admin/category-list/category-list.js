const serviceService = require('../../../services/service.service')
const { showError, showSuccess } = require('../../../utils/toast')

function mapCategory(category) {
  return {
    ...category,
    statusText: category.status === 'disabled' ? '已停用' : '启用中'
  }
}

Page({
  data: {
    title: '分类管理',
    categories: [],
    loading: true,
    seeding: false
  },

  onShow() {
    this.loadCategories()
  },

  onPullDownRefresh() {
    this.loadCategories().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadCategories() {
    this.setData({ loading: true })
    try {
      const data = await serviceService.getCategoryList({
        includeDisabled: true
      })
      this.setData({
        categories: (data.categories || []).map(mapCategory)
      })
    } catch (error) {
      showError(error.message || '分类加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async seedServiceData() {
    this.setData({ seeding: true })
    try {
      await serviceService.seedServiceData()
      showSuccess('同步完成')
      await this.loadCategories()
    } catch (error) {
      showError(error.message || '同步失败')
    } finally {
      this.setData({ seeding: false })
    }
  },

  goCreateCategory() {
    wx.navigateTo({
      url: '/pages/admin/category-edit/category-edit'
    })
  },

  goEditCategory(event) {
    const category = event.currentTarget.dataset || {}
    const params = [
      `categoryId=${encodeURIComponent(category.id || '')}`,
      `name=${encodeURIComponent(category.name || '')}`,
      `icon=${encodeURIComponent(category.icon || '')}`,
      `description=${encodeURIComponent(category.description || '')}`,
      `status=${encodeURIComponent(category.status || 'enabled')}`,
      `sort=${encodeURIComponent(category.sort || 0)}`
    ].join('&')
    wx.navigateTo({
      url: `/pages/admin/category-edit/category-edit?${params}`
    })
  }
})
