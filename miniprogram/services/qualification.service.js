const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.QUALIFICATION, [
  'getMyQualification',
  'saveQualificationDraft',
  'submitQualification',
  'resubmitQualification',
  'getMyDeposit',
  'mockPayDeposit',
  'applyDepositRefund',
  'getMyRiskStatus',
  'getOnboardingStatus',
  'adminListQualifications',
  'adminGetQualificationDetail',
  'adminReviewQualification',
  'adminListDeposits',
  'adminFreezeDeposit',
  'adminReviewDepositRefund',
  'adminSetRiskLevel',
  'adminAddRiskTag',
  'adminListRiskRecords',
  'adminGetOnboardingDetail',
  'getQualificationRequirements',
  'getDepositRules'
])
