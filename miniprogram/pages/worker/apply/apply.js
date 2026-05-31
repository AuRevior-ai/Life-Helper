const workerService = require('../../../services/worker.service')
const areaService = require('../../../services/area.service')
const { isPhone } = require('../../../utils/validator')
const { hideLoading, showError, showLoading, showSuccess } = require('../../../utils/toast')

const EMPTY_FORM = Object.freeze({
  name: '',
  phone: '',
  service_category: '',
  service_area: '',
  service_area_ids: [],
  service_communities: [],
  intro: ''
})

Page({
  data: {
    title: '师傅入驻',
    form: {
      ...EMPTY_FORM
    },
    areas: [],
    areaNames: [],
    selectedAreaIndex: -1,
    submitting: false
  },

  onLoad() {
    this.loadAreas()
  },

  async loadAreas() {
    try {
      const data = await areaService.getServiceAreaList()
      const areas = data.areas || []
      this.setData({
        areas,
        areaNames: areas.map((area) => area.full_name || `${area.city || ''} ${area.community || ''}`.trim())
      })
    } catch (error) {
      showError(error.message || '服务区域加载失败')
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  onAreaChange(event) {
    const selectedAreaIndex = Number(event.detail.value || 0)
    const area = this.data.areas[selectedAreaIndex]
    if (!area) return
    this.setData({
      selectedAreaIndex,
      'form.service_area': area.community || area.full_name || '',
      'form.service_area_ids': [area._id],
      'form.service_communities': [area.community || '']
    })
  },

  validateForm() {
    const form = this.data.form
    if (!form.name.trim() || !form.phone.trim() || !form.service_category.trim() || !form.service_area.trim()) {
      showError('请填写完整入驻信息')
      return false
    }

    if (!isPhone(form.phone)) {
      showError('手机号格式不正确')
      return false
    }

    return true
  },

  async handleSubmit() {
    if (!this.validateForm()) return

    this.setData({ submitting: true })
    showLoading('提交中')
    try {
      await workerService.applyWorker(this.data.form)
      showSuccess('已提交审核')
      wx.redirectTo({
        url: '/pages/worker/audit-status/audit-status'
      })
    } catch (error) {
      showError(error.message || '提交失败')
    } finally {
      hideLoading()
      this.setData({ submitting: false })
    }
  },

  goAuditStatus() {
    wx.navigateTo({
      url: '/pages/worker/audit-status/audit-status'
    })
  }
})
