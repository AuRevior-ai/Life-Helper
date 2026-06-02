const test = require('node:test')
const assert = require('node:assert/strict')
const { createQualificationEnv } = require('./_phase20.helpers')

test('mock deposit payment creates mock-only record and never returns real pay params', async () => {
  const { handleQualification } = require('../cloudfunctions/qualification/handler')
  const env = createQualificationEnv()

  const initial = await handleQualification({ action: 'getMyDeposit' }, env)
  assert.equal(initial.success, true)
  assert.equal(initial.data.deposit.deposit_status, 'UNPAID')
  assert.equal(initial.data.deposit.required_amount, 50000)

  const paid = await handleQualification({ action: 'mockPayDeposit' }, env)
  assert.equal(paid.success, true)
  assert.equal(paid.data.deposit.deposit_status, 'MOCK_PAID')
  assert.match(paid.data.deposit.mock_pay_no, /^MOCK_DEPOSIT_/)
  assert.equal(Object.prototype.hasOwnProperty.call(paid.data, 'payParams'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(paid.data, 'prepay_id'), false)
  assert.equal(env.onboardingLogs.records.at(-1).event_type, 'deposit_mock_paid')
})

test('deposit refund and freeze actions require administrator review', async () => {
  const { handleQualification } = require('../cloudfunctions/qualification/handler')
  const env = createQualificationEnv()
  await handleQualification({ action: 'mockPayDeposit' }, env)

  const refund = await handleQualification({ action: 'applyDepositRefund', reason: '关闭店铺' }, env)
  assert.equal(refund.success, true)
  assert.equal(refund.data.deposit.deposit_status, 'REFUND_PENDING')

  const freezeDenied = await handleQualification({ action: 'adminFreezeDeposit', depositId: refund.data.deposit._id, reason: '风险复核' }, env)
  assert.equal(freezeDenied.success, false)
  assert.equal(freezeDenied.errorCode, 'PERMISSION_DENIED')

  const rejected = await handleQualification({
    action: 'adminReviewDepositRefund',
    depositId: refund.data.deposit._id,
    reviewResult: 'REJECTED',
    reason: '仍有未完成订单'
  }, { ...env, openid: 'openid_admin' })
  assert.equal(rejected.success, true)
  assert.equal(rejected.data.deposit.deposit_status, 'REFUND_REJECTED')
  assert.equal(rejected.data.deposit.refund_reject_reason, '仍有未完成订单')

  const refundAgain = await handleQualification({ action: 'applyDepositRefund', reason: '再次申请' }, env)
  const approved = await handleQualification({
    action: 'adminReviewDepositRefund',
    depositId: refundAgain.data.deposit._id,
    reviewResult: 'APPROVED',
    reason: 'mock 退还通过'
  }, { ...env, openid: 'openid_admin' })
  assert.equal(approved.success, true)
  assert.equal(approved.data.deposit.deposit_status, 'MOCK_REFUNDED')
})
