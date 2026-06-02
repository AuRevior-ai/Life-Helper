const cloud = require('wx-server-sdk')
const { handleMerchant } = require('./handler')
const {
  createMerchantRepository,
  createMerchantServiceRepository,
  createServiceProviderRepository,
  createMerchantLogRepository,
  createUserRepository,
  createServiceRepository,
  createOrderRepository,
  createMessageRepository
} = require('./repositories')
const {
  createQualificationRepository,
  createDepositRepository,
  createRiskRecordRepository,
  createOnboardingLogRepository
} = require('./qualification-repositories')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleMerchant(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db),
    merchants: createMerchantRepository(db),
    merchantServices: createMerchantServiceRepository(db),
    serviceProviders: createServiceProviderRepository(db),
    merchantLogs: createMerchantLogRepository(db),
    services: createServiceRepository(db),
    orders: createOrderRepository(db),
    messages: createMessageRepository(db),
    qualifications: createQualificationRepository(db),
    deposits: createDepositRepository(db),
    riskRecords: createRiskRecordRepository(db),
    onboardingLogs: createOnboardingLogRepository(db)
  })
}
