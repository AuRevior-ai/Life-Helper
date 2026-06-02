const { fail } = require('./_shared/response')
const qualification = require('./qualification.service')
const deposit = require('./deposit.service')
const risk = require('./risk.service')

const actions = Object.freeze({
  getMyQualification: qualification.getMyQualification,
  saveQualificationDraft: qualification.saveQualificationDraft,
  submitQualification: qualification.submitQualification,
  resubmitQualification: qualification.resubmitQualification,
  adminListQualifications: qualification.adminListQualifications,
  adminGetQualificationDetail: qualification.adminGetQualificationDetail,
  adminReviewQualification: qualification.adminReviewQualification,
  getQualificationRequirements: qualification.getQualificationRequirements,
  getMyDeposit: deposit.getMyDeposit,
  mockPayDeposit: deposit.mockPayDeposit,
  applyDepositRefund: deposit.applyDepositRefund,
  adminListDeposits: deposit.adminListDeposits,
  adminFreezeDeposit: deposit.adminFreezeDeposit,
  adminReviewDepositRefund: deposit.adminReviewDepositRefund,
  getDepositRules: deposit.getDepositRules,
  getMyRiskStatus: risk.getMyRiskStatus,
  getOnboardingStatus: risk.getOnboardingStatus,
  adminSetRiskLevel: risk.adminSetRiskLevel,
  adminAddRiskTag: risk.adminAddRiskTag,
  adminListRiskRecords: risk.adminListRiskRecords,
  adminGetOnboardingDetail: risk.adminGetOnboardingDetail,
  adminSetOnboardingLimit: risk.adminSetOnboardingLimit
})

async function handleQualification(event = {}, env = {}) {
  const action = actions[event.action]
  if (!action) return fail('ACTION_NOT_FOUND', '未知资质保证金操作')
  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '资质保证金操作失败')
  }
}

module.exports = {
  handleQualification,
  actions
}
