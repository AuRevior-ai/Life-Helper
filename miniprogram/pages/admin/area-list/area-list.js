const areaService = require('../../../services/area.service')
const { showError, showSuccess } = require('../../../utils/toast')

Page({
  data: {
    title: '区域管理',
    areas: [],
    loading: true
  },

  onShow() {
    this.loadAreas()
  },

  async loadAreas() {
    this.setData({ loading: true })
    try {
      const data = await areaService.getServiceAreaList({ includeDisabled: true })
      this.setData({ areas: data.areas || [] })
    } catch (error) {
      showError(error.message || '区域加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/area-edit/area-edit' })
  },

  goEdit(event) {
    wx.navigateTo({
      url: `/pages/admin/area-edit/area-edit?areaId=${event.currentTarget.dataset.id}`
    })
  },

  async toggleStatus(event) {
    const { id, status } = event.currentTarget.dataset
    try {
      if (status === 'enabled') {
        await areaService.adminDisableServiceArea({ areaId: id })
      } else {
        await areaService.adminEnableServiceArea({ areaId: id })
      }
      showSuccess('区域状态已更新')
      this.loadAreas()
    } catch (error) {
      showError(error.message || '状态更新失败')
    }
  }
})
