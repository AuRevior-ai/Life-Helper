const qualificationService = require('../../../services/qualification.service')
const { showError, showSuccess } = require('../../../utils/toast')

Page({
  data: {
    qualification: {},
    qualificationStatus: 'NOT_SUBMITTED',
    form: {
      subjectType: 'individual',
      realNameMock: '模拟姓名',
      phone: '13800138000',
      serviceCategories: ['家政保洁'],
      agreementChecked: true
    }
  },

  onLoad() { this.loadQualification() },

  async loadQualification() {
    try {
      const data = await qualificationService.getMyQualification()
      this.setData({
        qualification: data.qualification || {},
        qualificationStatus: data.qualification_status || 'NOT_SUBMITTED'
      })
    } catch (error) {
      showError(error.message || '资质信息加载失败')
    }
  },

  onInput(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  async saveDraft() {
    try {
      await qualificationService.saveQualificationDraft(this.data.form)
      showSuccess('资质草稿已保存')
      await this.loadQualification()
    } catch (error) {
      showError(error.message || '保存失败')
    }
  },

  async submit() {
    try {
      await qualificationService.submitQualification(this.data.form)
      showSuccess('资质已提交审核')
      await this.loadQualification()
    } catch (error) {
      showError(error.message || '提交失败')
    }
  }
})
