const test = require('node:test')
const assert = require('node:assert/strict')
const { createMemoryCollection, createMemoryUsers, createMemoryMerchants, createOwnerRepository, createQualificationEnv, fixedNow } = require('./_phase20.helpers')

test('onboarding status depends on qualification, deposit, risk, and manual limit', async () => {
  const { handleQualification } = require('../cloudfunctions/qualification/handler')
  const env = createQualificationEnv()

  const incomplete = await handleQualification({ action: 'getOnboardingStatus' }, env)
  assert.equal(incomplete.success, true)
  assert.equal(incomplete.data.onboarding_status, 'INCOMPLETE')
  assert.equal(incomplete.data.can_operate, false)

  await handleQualification({ action: 'saveQualificationDraft', agreementChecked: true }, env)
  const waiting = await handleQualification({ action: 'submitQualification' }, env)
  assert.equal(waiting.data.onboarding_status, 'QUALIFICATION_WAIT')

  await handleQualification({
    action: 'adminReviewQualification',
    qualificationId: waiting.data.qualification._id,
    reviewResult: 'APPROVED',
    reason: 'mock 通过'
  }, { ...env, openid: 'openid_admin' })
  const depositWait = await handleQualification({ action: 'getOnboardingStatus' }, env)
  assert.equal(depositWait.data.onboarding_status, 'DEPOSIT_WAIT')

  await handleQualification({ action: 'mockPayDeposit' }, env)
  const active = await handleQualification({ action: 'getOnboardingStatus' }, env)
  assert.equal(active.data.onboarding_status, 'ACTIVE')
  assert.equal(active.data.can_operate, true)

  await handleQualification({
    action: 'adminSetRiskLevel',
    merchantId: 'merchant_1',
    riskLevel: 'BLOCKED',
    reason: '限制入驻'
  }, { ...env, openid: 'openid_admin' })
  const blocked = await handleQualification({ action: 'getOnboardingStatus' }, env)
  assert.equal(blocked.data.onboarding_status, 'BLOCKED')
  assert.equal(blocked.data.can_operate, false)

  await handleQualification({
    action: 'adminSetRiskLevel',
    merchantId: 'merchant_1',
    riskLevel: 'LOW',
    reason: '解除限制'
  }, { ...env, openid: 'openid_admin' })
  const limited = await handleQualification({
    action: 'adminSetOnboardingLimit',
    merchantId: 'merchant_1',
    limited: true,
    reason: '人工限制经营'
  }, { ...env, openid: 'openid_admin' })
  assert.equal(limited.success, true)
  assert.equal(limited.data.onboarding_status, 'LIMITED')
})

test('merchant service publishing is blocked when onboarding risk is blocked', async () => {
  const { handleMerchant } = require('../cloudfunctions/merchant/handler')
  const qualifications = createOwnerRepository(createMemoryCollection([
    { _id: 'q1', merchant_id: 'merchant_1', provider_type: 'merchant', qualification_status: 'APPROVED' }
  ]))
  const deposits = createOwnerRepository(createMemoryCollection([
    { _id: 'd1', merchant_id: 'merchant_1', provider_type: 'merchant', deposit_status: 'MOCK_PAID', required_amount: 50000, paid_amount: 50000 }
  ]))
  const riskRecords = createMemoryCollection([
    { _id: 'r1', merchant_id: 'merchant_1', provider_type: 'merchant', risk_level: 'BLOCKED', risk_tags: ['MANUAL_REVIEW_REQUIRED'], created_at: fixedNow() }
  ])
  const env = {
    openid: 'openid_merchant',
    users: createMemoryUsers([{ _id: 'u1', openid: 'openid_merchant', role: 'user', status: 'normal' }]),
    merchants: createMemoryMerchants([{ _id: 'merchant_1', user_id: 'openid_merchant', store_name: '未来家政店', audit_status: 'approved', status: 'normal' }]),
    merchantServices: createMemoryCollection(),
    serviceProviders: {
      async findByRef() {
        return { _id: 'provider_1' }
      }
    },
    merchantLogs: createMemoryCollection(),
    services: createMemoryCollection([{ _id: 'svc_clean', name: '日常保洁', price: 8800, category_id: 'cat_clean', category_name: '家政保洁' }]),
    qualifications,
    deposits,
    riskRecords,
    onboardingLogs: createMemoryCollection(),
    now: fixedNow
  }

  const result = await handleMerchant({ action: 'createMerchantService', serviceId: 'svc_clean', price: 8800 }, env)
  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'MERCHANT_ONBOARDING_BLOCKED')
})
