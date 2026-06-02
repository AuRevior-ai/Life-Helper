const { success, serviceError } = require('./_shared/response')
const { getPayload } = require('./_shared/payload')
const { getNow } = require('./_shared/time')
const { paginateList } = require('./_shared/pagination')
const {
  DEPOSIT_STATUS,
  DEFAULT_DEPOSIT_AMOUNT
} = require('./qualification.constants')
const { trimText } = require('./qualification.validator')
const { requireAdmin, requireOpenid, resolveMyProviderContext } = require('./qualification.service')
const {
  findOwnedDeposit,
  getOnboardingSnapshot,
  createOnboardingLog
} = require('./onboarding.service')

async function ensureDeposit(context, env) {
  const existing = await findOwnedDeposit(context, env)
  if (existing) return existing
  const now = getNow(env)
  return env.deposits.create({
    ...context,
    required_amount: DEFAULT_DEPOSIT_AMOUNT,
    paid_amount: 0,
    currency: 'CNY',
    deposit_status: DEPOSIT_STATUS.UNPAID,
    created_at: now,
    updated_at: now
  })
}

async function getMyDeposit(event, env) {
  const context = await resolveMyProviderContext(env)
  const deposit = await ensureDeposit(context, env)
  const snapshot = await getOnboardingSnapshot(context, env)
  return success({ deposit, onboarding_status: snapshot.onboarding_status })
}

async function mockPayDeposit(event, env) {
  const context = await resolveMyProviderContext(env)
  const existing = await ensureDeposit(context, env)
  const now = getNow(env)
  const deposit = await env.deposits.updateById(existing._id, {
    deposit_status: DEPOSIT_STATUS.MOCK_PAID,
    paid_amount: Number(existing.required_amount || DEFAULT_DEPOSIT_AMOUNT),
    mock_pay_no: `MOCK_DEPOSIT_${context.merchant_id}_${Date.parse(now)}`,
    mock_paid_at: now,
    updated_at: now
  })
  await createOnboardingLog(env, {
    ...context,
    event_type: 'deposit_mock_paid',
    before_status: existing.deposit_status,
    after_status: DEPOSIT_STATUS.MOCK_PAID,
    operator_role: 'merchant',
    remark: '模拟保证金缴纳，不产生真实扣款'
  })
  return success({ deposit })
}

async function applyDepositRefund(event, env) {
  const context = await resolveMyProviderContext(env)
  const existing = await ensureDeposit(context, env)
  if (![DEPOSIT_STATUS.MOCK_PAID, DEPOSIT_STATUS.REFUND_REJECTED, DEPOSIT_STATUS.FROZEN].includes(existing.deposit_status)) {
    throw serviceError('DEPOSIT_STATUS_INVALID', '当前保证金状态不能申请退还')
  }
  const payload = getPayload(event)
  const deposit = await env.deposits.updateById(existing._id, {
    deposit_status: DEPOSIT_STATUS.REFUND_PENDING,
    refund_apply_reason: trimText(payload.reason) || '商家申请模拟退还',
    updated_at: getNow(env)
  })
  await createOnboardingLog(env, {
    ...context,
    event_type: 'deposit_refund_applied',
    before_status: existing.deposit_status,
    after_status: DEPOSIT_STATUS.REFUND_PENDING,
    operator_role: 'merchant'
  })
  return success({ deposit })
}

async function adminListDeposits(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  let list = await env.deposits.findAll()
  if (payload.status) list = list.filter((item) => item.deposit_status === payload.status)
  return success(paginateList(list, payload, { listKey: 'deposits' }))
}

async function adminFreezeDeposit(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const id = payload.depositId || payload.deposit_id
  const existing = await env.deposits.findById(id)
  if (!existing) throw serviceError('DEPOSIT_NOT_FOUND', '保证金记录不存在')
  const deposit = await env.deposits.updateById(id, {
    deposit_status: DEPOSIT_STATUS.FROZEN,
    frozen_reason: trimText(payload.reason) || '平台风控复核',
    operator_openid: requireOpenid(env),
    updated_at: getNow(env)
  })
  await createOnboardingLog(env, {
    ...existing,
    event_type: 'deposit_frozen',
    before_status: existing.deposit_status,
    after_status: DEPOSIT_STATUS.FROZEN,
    operator_role: 'admin',
    remark: trimText(payload.reason)
  })
  return success({ deposit })
}

async function adminReviewDepositRefund(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const id = payload.depositId || payload.deposit_id
  const existing = await env.deposits.findById(id)
  if (!existing) throw serviceError('DEPOSIT_NOT_FOUND', '保证金记录不存在')
  if (existing.deposit_status !== DEPOSIT_STATUS.REFUND_PENDING) {
    throw serviceError('DEPOSIT_STATUS_INVALID', '当前保证金状态不能审核退还')
  }
  const approved = trimText(payload.reviewResult || payload.review_result) === 'APPROVED'
  const deposit = await env.deposits.updateById(id, {
    deposit_status: approved ? DEPOSIT_STATUS.MOCK_REFUNDED : DEPOSIT_STATUS.REFUND_REJECTED,
    refund_review_result: approved ? 'APPROVED' : 'REJECTED',
    refund_reject_reason: approved ? '' : trimText(payload.reason) || '退还申请不符合 mock 规则',
    operator_openid: requireOpenid(env),
    updated_at: getNow(env)
  })
  await createOnboardingLog(env, {
    ...existing,
    event_type: 'deposit_refund_review',
    before_status: existing.deposit_status,
    after_status: deposit.deposit_status,
    operator_role: 'admin',
    remark: trimText(payload.reason)
  })
  return success({ deposit })
}

function getDepositRules() {
  return success({
    required_amount: DEFAULT_DEPOSIT_AMOUNT,
    currency: 'CNY',
    mock_warning: '当前为模拟保证金流程，不会产生真实扣款、退款或分账。'
  })
}

module.exports = {
  ensureDeposit,
  getMyDeposit,
  mockPayDeposit,
  applyDepositRefund,
  adminListDeposits,
  adminFreezeDeposit,
  adminReviewDepositRefund,
  getDepositRules
}
