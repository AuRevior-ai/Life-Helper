const qualificationService = require('../../../services/qualification.service')
const { showError, showSuccess } = require('../../../utils/toast')

function isCollectionMissing(error = {}) {
  return /DATABASE_COLLECTION_NOT_EXIST|collection not exists|Db or Table not exist|merchant_qualifications/.test(error.message || '')
}

Page({
  data: {
    qualifications: [],
    collectionMissing: false,
    loading: true
  },
  onLoad() { this.loadList() },
  async loadList() {
    this.setData({ loading: true, collectionMissing: false })
    try {
      const data = await qualificationService.adminListQualifications()
      this.setData({ qualifications: data.qualifications || data.list || [], collectionMissing: data.collection_missing === true })
    } catch (error) {
      if (isCollectionMissing(error)) {
        this.setData({ qualifications: [], collectionMissing: true })
        return
      }
      showError(error.message || '资质列表加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },
  async review(event) {
    try {
      await qualificationService.adminReviewQualification({
        qualificationId: event.currentTarget.dataset.id,
        reviewResult: event.currentTarget.dataset.result,
        reason: '阶段 20 mock 审核'
      })
      showSuccess('审核已处理')
      await this.loadList()
    } catch (error) {
      showError(error.message || '审核失败')
    }
  }
})
