const {
  DEFAULT_PLATFORM_COMMISSION_RATE_BPS,
  DEFAULT_SETTLEMENT_FREEZE_DAYS
} = require('./finance-config')

const USER_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled'
})

const USER_ROLE = Object.freeze({
  ADMIN: 'admin'
})

const ORDER_STATUS = Object.freeze({
  COMPLETED: 'completed'
})

const PAY_STATUS = Object.freeze({
  PAID: 'paid'
})

const FINANCE_LOG_TYPE = Object.freeze({
  ORDER_INCOME: 'order_income',
  PLATFORM_COMMISSION: 'platform_commission',
  WORKER_EARNING: 'worker_earning',
  REFUND_REVERSE: 'refund_reverse',
  EARNING_REVERSE: 'earning_reverse',
  MANUAL_ADJUST: 'manual_adjust'
})

const FINANCE_LOG_DIRECTION = Object.freeze({
  IN: 'in',
  OUT: 'out',
  REVERSE: 'reverse'
})

const FINANCE_LOG_STATUS = Object.freeze({
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING_MANUAL: 'pending_manual'
})

const WORKER_EARNING_STATUS = Object.freeze({
  FROZEN: 'frozen',
  SETTLEABLE: 'settleable',
  SETTLED: 'settled',
  REVERSED: 'reversed',
  PENDING_MANUAL: 'pending_manual'
})

const SETTLEMENT_STATUS = Object.freeze({
  NOT_SETTLED: 'not_settled',
  SETTLEABLE: 'settleable',
  SETTLED: 'settled',
  REVERSED: 'reversed'
})

function success(data, message = 'success') {
  return { success: true, data, message }
}

function fail(errorCode, message) {
  return { success: false, errorCode, message }
}

function serviceError(errorCode, message) {
  const error = new Error(message)
  error.errorCode = errorCode
  return error
}

function getPayload(event = {}) {
  if (event.payload && typeof event.payload === 'object') {
    return event.payload
  }
  const { action, ...payload } = event
  return payload
}

function getNow(env = {}) {
  return env.now ? env.now() : new Date()
}

function requireOpenid(env = {}) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

async function requireAdmin(env = {}) {
  const user = await env.users.findByOpenid(requireOpenid(env))
  if (!user || user.status === USER_STATUS.DISABLED) {
    throw serviceError('USER_NOT_FOUND', '管理员用户不存在或已禁用')
  }
  if (user.role !== USER_ROLE.ADMIN) {
    throw serviceError('PERMISSION_DENIED', '当前操作需要管理员权限')
  }
  return user
}

function parsePositiveInteger(value, fallback) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) return fallback
  return number
}

function paginateList(records, payload = {}) {
  const page = parsePositiveInteger(payload.page, 1)
  const pageSize = Math.min(parsePositiveInteger(payload.pageSize, 20), 50)
  const total = records.length
  const start = (page - 1) * pageSize
  const list = records.slice(start, start + pageSize)
  return {
    list,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total
  }
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function createFinanceNo(env = {}) {
  if (env.financeNoFactory) return env.financeNoFactory()
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `FN${Date.now()}${random}`
}

function createEarningNo(env = {}) {
  if (env.earningNoFactory) return env.earningNoFactory()
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `EN${Date.now()}${random}`
}

function getPaidAmount(order = {}) {
  return Number(order.pay_amount || order.price || 0)
}

function calculateFinance(order = {}, config = {}) {
  const paidAmount = getPaidAmount(order)
  const commissionRateBps = Number(config.commissionRateBps || DEFAULT_PLATFORM_COMMISSION_RATE_BPS)
  const platformCommissionAmount = Math.round(paidAmount * commissionRateBps / 10000)
  const workerEarningAmount = Math.max(paidAmount - platformCommissionAmount, 0)
  return {
    orderAmount: Number(order.price || paidAmount || 0),
    paidAmount,
    commissionRateBps,
    commissionRate: commissionRateBps / 10000,
    platformCommissionAmount,
    workerEarningAmount,
    freezeDays: Number(config.freezeDays || DEFAULT_SETTLEMENT_FREEZE_DAYS)
  }
}

async function requireFinanceRepositories(env = {}) {
  if (!env.orders || !env.orders.findById || !env.orders.updateById) {
    throw serviceError('ORDER_REPOSITORY_MISSING', '缺少订单集合')
  }
  if (!env.financeLogs || !env.financeLogs.create) {
    throw serviceError('FINANCE_LOG_REPOSITORY_MISSING', '缺少财务流水集合')
  }
  if (!env.workerEarnings || !env.workerEarnings.create) {
    throw serviceError('WORKER_EARNING_REPOSITORY_MISSING', '缺少师傅收益集合')
  }
}

async function createFinanceLog(env, data) {
  const now = getNow(env)
  return env.financeLogs.create({
    status: FINANCE_LOG_STATUS.SUCCESS,
    source: 'system',
    remark: '',
    error_message: '',
    created_at: now,
    updated_at: now,
    created_by: env.openid || 'system',
    ...data
  })
}

async function buildAlreadyGeneratedResult(order, env) {
  const earnings = env.workerEarnings.findByOrderId
    ? await env.workerEarnings.findByOrderId(order._id)
    : []
  return success({
    already_generated: true,
    code: 'FINANCE_ALREADY_GENERATED',
    order,
    workerEarning: earnings[0] || null
  })
}

async function generateOrderFinance(event = {}, env = {}) {
  await requireFinanceRepositories(env)
  const payload = getPayload(event)
  if (!payload.orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(payload.orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }
  if (order.finance_generated) {
    return buildAlreadyGeneratedResult(order, env)
  }

  const existingEarning = env.workerEarnings.findActiveByOrderId
    ? await env.workerEarnings.findActiveByOrderId(order._id)
    : null
  if (existingEarning) {
    return success({
      already_generated: true,
      code: 'FINANCE_ALREADY_GENERATED',
      order,
      workerEarning: existingEarning
    })
  }

  if (order.status !== ORDER_STATUS.COMPLETED) {
    throw serviceError('ORDER_NOT_COMPLETED', '订单未完成，不能生成财务记录')
  }
  if (order.pay_status !== PAY_STATUS.PAID) {
    throw serviceError('ORDER_NOT_PAID', '订单未支付，不能生成财务记录')
  }
  if (!order.worker_id) {
    throw serviceError('ORDER_WORKER_MISSING', '订单没有师傅，不能生成收益')
  }

  const now = getNow(env)
  const financeNo = createFinanceNo(env)
  const earningNo = createEarningNo(env)
  const amounts = calculateFinance(order, env.financeConfig || {})
  const frozenUntil = addDays(now, amounts.freezeDays)

  const baseLog = {
    finance_no: financeNo,
    order_id: order._id,
    order_no: order.order_no || '',
    user_id: order.user_id,
    worker_id: order.worker_id,
    order_amount: amounts.orderAmount,
    paid_amount: amounts.paidAmount,
    commission_rate: amounts.commissionRate,
    commission_rate_bps: amounts.commissionRateBps,
    platform_commission_amount: amounts.platformCommissionAmount,
    worker_earning_amount: amounts.workerEarningAmount,
    source: payload.source || 'mock_payment'
  }

  const orderIncomeLog = await createFinanceLog(env, {
    ...baseLog,
    type: FINANCE_LOG_TYPE.ORDER_INCOME,
    direction: FINANCE_LOG_DIRECTION.IN,
    amount: amounts.paidAmount,
    remark: '订单完成收入'
  })
  await createFinanceLog(env, {
    ...baseLog,
    type: FINANCE_LOG_TYPE.PLATFORM_COMMISSION,
    direction: FINANCE_LOG_DIRECTION.IN,
    amount: amounts.platformCommissionAmount,
    remark: '平台服务费'
  })
  await createFinanceLog(env, {
    ...baseLog,
    type: FINANCE_LOG_TYPE.WORKER_EARNING,
    direction: FINANCE_LOG_DIRECTION.OUT,
    amount: amounts.workerEarningAmount,
    remark: '师傅订单收益'
  })

  const workerEarning = await env.workerEarnings.create({
    earning_no: earningNo,
    order_id: order._id,
    order_no: order.order_no || '',
    user_id: order.user_id,
    worker_id: order.worker_id,
    service_name: order.service_name || '',
    appointment_time: order.appointment_time || '',
    order_amount: amounts.orderAmount,
    paid_amount: amounts.paidAmount,
    commission_rate: amounts.commissionRate,
    commission_rate_bps: amounts.commissionRateBps,
    platform_commission_amount: amounts.platformCommissionAmount,
    worker_earning_amount: amounts.workerEarningAmount,
    status: WORKER_EARNING_STATUS.FROZEN,
    settlement_status: SETTLEMENT_STATUS.NOT_SETTLED,
    freeze_days: amounts.freezeDays,
    frozen_until: frozenUntil,
    settled_at: null,
    reversed_at: null,
    refund_id: '',
    refund_amount: 0,
    remark: '订单完成后生成',
    created_at: now,
    updated_at: now
  })

  const updatedOrder = await env.orders.updateById(order._id, {
    finance_generated: true,
    finance_generated_at: now,
    finance_no: orderIncomeLog.finance_no || financeNo,
    earning_no: workerEarning.earning_no,
    settlement_status: SETTLEMENT_STATUS.NOT_SETTLED,
    commission_rate: amounts.commissionRate,
    commission_rate_bps: amounts.commissionRateBps,
    platform_commission_amount: amounts.platformCommissionAmount,
    worker_earning_amount: amounts.workerEarningAmount,
    updated_at: now
  })

  return success({
    already_generated: false,
    order: updatedOrder,
    workerEarning
  })
}

async function reverseOrderFinance(event = {}, env = {}) {
  await requireFinanceRepositories(env)
  const payload = getPayload(event)
  if (!payload.orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }
  const order = await env.orders.findById(payload.orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  const allEarnings = env.workerEarnings.findByOrderId
    ? await env.workerEarnings.findByOrderId(order._id)
    : []
  const currentEarning = allEarnings.find((item) => item.status !== WORKER_EARNING_STATUS.REVERSED) || allEarnings[0]

  if (!currentEarning) {
    await createFinanceLog(env, {
      finance_no: createFinanceNo(env),
      order_id: order._id,
      order_no: order.order_no || '',
      user_id: order.user_id,
      worker_id: order.worker_id || '',
      type: FINANCE_LOG_TYPE.REFUND_REVERSE,
      direction: FINANCE_LOG_DIRECTION.REVERSE,
      amount: Number(payload.refundAmount || order.refund_amount || 0),
      status: FINANCE_LOG_STATUS.PENDING_MANUAL,
      source: 'mock_refund',
      remark: '订单未生成收益，无需自动回冲'
    })
    return success({
      already_reversed: false,
      manual_required: true,
      workerEarning: null
    })
  }

  if (currentEarning.status === WORKER_EARNING_STATUS.REVERSED) {
    return success({
      already_reversed: true,
      workerEarning: currentEarning
    })
  }

  const now = getNow(env)
  const refundAmount = Number(payload.refundAmount || order.refund_amount || currentEarning.paid_amount || 0)
  const financeNo = createFinanceNo(env)

  if (currentEarning.status === WORKER_EARNING_STATUS.SETTLED || currentEarning.settlement_status === SETTLEMENT_STATUS.SETTLED) {
    const workerEarning = await env.workerEarnings.updateById(currentEarning._id, {
      status: WORKER_EARNING_STATUS.PENDING_MANUAL,
      settlement_status: SETTLEMENT_STATUS.SETTLED,
      refund_id: payload.refundId || '',
      refund_amount: refundAmount,
      remark: '已结算收益发生退款，需人工处理',
      updated_at: now
    })
    await createFinanceLog(env, {
      finance_no: financeNo,
      order_id: order._id,
      order_no: order.order_no || '',
      user_id: order.user_id,
      worker_id: order.worker_id || currentEarning.worker_id,
      type: FINANCE_LOG_TYPE.MANUAL_ADJUST,
      direction: FINANCE_LOG_DIRECTION.REVERSE,
      amount: refundAmount,
      order_amount: currentEarning.order_amount || order.price || 0,
      paid_amount: currentEarning.paid_amount || getPaidAmount(order),
      platform_commission_amount: currentEarning.platform_commission_amount || 0,
      worker_earning_amount: currentEarning.worker_earning_amount || 0,
      status: FINANCE_LOG_STATUS.PENDING_MANUAL,
      source: 'mock_refund',
      remark: '已结算收益退款需人工处理'
    })
    await env.orders.updateById(order._id, {
      finance_reverse_status: WORKER_EARNING_STATUS.PENDING_MANUAL,
      finance_reversed_at: now,
      updated_at: now
    })
    return success({
      already_reversed: false,
      manual_required: true,
      workerEarning
    })
  }

  const workerEarning = await env.workerEarnings.updateById(currentEarning._id, {
    status: WORKER_EARNING_STATUS.REVERSED,
    settlement_status: SETTLEMENT_STATUS.REVERSED,
    reversed_at: now,
    refund_id: payload.refundId || '',
    refund_amount: refundAmount,
    remark: '退款后收益已冲回',
    updated_at: now
  })
  const baseLog = {
    finance_no: financeNo,
    order_id: order._id,
    order_no: order.order_no || '',
    user_id: order.user_id,
    worker_id: order.worker_id || currentEarning.worker_id,
    order_amount: currentEarning.order_amount || order.price || 0,
    paid_amount: currentEarning.paid_amount || getPaidAmount(order),
    commission_rate: currentEarning.commission_rate || DEFAULT_PLATFORM_COMMISSION_RATE_BPS / 10000,
    commission_rate_bps: currentEarning.commission_rate_bps || DEFAULT_PLATFORM_COMMISSION_RATE_BPS,
    platform_commission_amount: currentEarning.platform_commission_amount || 0,
    worker_earning_amount: currentEarning.worker_earning_amount || 0,
    source: 'mock_refund'
  }
  await createFinanceLog(env, {
    ...baseLog,
    type: FINANCE_LOG_TYPE.REFUND_REVERSE,
    direction: FINANCE_LOG_DIRECTION.REVERSE,
    amount: refundAmount,
    remark: '订单退款财务回冲'
  })
  await createFinanceLog(env, {
    ...baseLog,
    type: FINANCE_LOG_TYPE.EARNING_REVERSE,
    direction: FINANCE_LOG_DIRECTION.REVERSE,
    amount: currentEarning.worker_earning_amount || 0,
    remark: '师傅收益冲回'
  })
  await env.orders.updateById(order._id, {
    finance_reverse_status: WORKER_EARNING_STATUS.REVERSED,
    finance_reversed_at: now,
    updated_at: now
  })

  return success({
    already_reversed: false,
    workerEarning
  })
}

function buildWorkerIncomeSummary(earnings = []) {
  return earnings.reduce((summary, earning) => {
    const amount = Number(earning.worker_earning_amount || 0)
    summary.total_count += 1
    summary.total_amount += amount
    if (earning.status === WORKER_EARNING_STATUS.FROZEN) {
      summary.frozen_amount += amount
      summary.frozen_count += 1
    } else if (earning.status === WORKER_EARNING_STATUS.SETTLEABLE) {
      summary.settleable_amount += amount
      summary.settleable_count += 1
    } else if (earning.status === WORKER_EARNING_STATUS.SETTLED) {
      summary.settled_amount += amount
      summary.settled_count += 1
    } else if (earning.status === WORKER_EARNING_STATUS.REVERSED) {
      summary.reversed_amount += amount
      summary.reversed_count += 1
    }
    return summary
  }, {
    total_amount: 0,
    frozen_amount: 0,
    settleable_amount: 0,
    settled_amount: 0,
    reversed_amount: 0,
    total_count: 0,
    frozen_count: 0,
    settleable_count: 0,
    settled_count: 0,
    reversed_count: 0
  })
}

async function getWorkerIncomeSummary(event = {}, env = {}) {
  const workerId = requireOpenid(env)
  const earnings = await env.workerEarnings.findByWorkerId(workerId)
  return success(buildWorkerIncomeSummary(earnings))
}

async function getWorkerEarningList(event = {}, env = {}) {
  const workerId = requireOpenid(env)
  const payload = getPayload(event)
  let earnings = await env.workerEarnings.findByWorkerId(workerId)
  if (payload.status) {
    earnings = earnings.filter((earning) => earning.status === payload.status)
  }
  const pageData = paginateList(earnings, payload)
  return success({
    ...pageData,
    earnings: pageData.list
  })
}

async function adminGetFinanceLogs(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  let logs = await env.financeLogs.findAll()
  if (payload.orderId) logs = logs.filter((log) => log.order_id === payload.orderId)
  if (payload.workerId) logs = logs.filter((log) => log.worker_id === payload.workerId)
  if (payload.type) logs = logs.filter((log) => log.type === payload.type)
  if (payload.status) logs = logs.filter((log) => log.status === payload.status)
  const pageData = paginateList(logs, payload)
  return success({
    ...pageData,
    logs: pageData.list
  })
}

async function adminGetWorkerEarnings(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  let earnings = await env.workerEarnings.findAll()
  if (payload.workerId) earnings = earnings.filter((earning) => earning.worker_id === payload.workerId)
  if (payload.status) earnings = earnings.filter((earning) => earning.status === payload.status)
  const pageData = paginateList(earnings, payload)
  return success({
    ...pageData,
    earnings: pageData.list
  })
}

async function adminGetOrderFinanceDetail(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }
  const order = await env.orders.findById(payload.orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }
  const logs = env.financeLogs.findByOrderId ? await env.financeLogs.findByOrderId(order._id) : []
  const earnings = env.workerEarnings.findByOrderId ? await env.workerEarnings.findByOrderId(order._id) : []
  return success({ order, logs, earnings })
}

async function mockUnlockSettlement(event = {}, env = {}) {
  await requireAdmin(env)
  const now = getNow(env)
  const allEarnings = await env.workerEarnings.findAll()
  const unlocked = []
  for (const earning of allEarnings) {
    const frozenUntil = earning.frozen_until ? new Date(earning.frozen_until) : null
    if (earning.status === WORKER_EARNING_STATUS.FROZEN && (!frozenUntil || frozenUntil <= now)) {
      const updated = await env.workerEarnings.updateById(earning._id, {
        status: WORKER_EARNING_STATUS.SETTLEABLE,
        settlement_status: SETTLEMENT_STATUS.SETTLEABLE,
        updated_at: now
      })
      unlocked.push(updated)
    }
  }
  return success({ unlocked })
}

const actions = Object.freeze({
  generateOrderFinance,
  reverseOrderFinance,
  getWorkerIncomeSummary,
  getWorkerEarningList,
  adminGetFinanceLogs,
  adminGetWorkerEarnings,
  adminGetOrderFinanceDetail,
  mockUnlockSettlement
})

async function handleFinance(event = {}, env = {}) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知财务操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '财务操作失败')
  }
}

module.exports = {
  handleFinance,
  generateOrderFinance,
  reverseOrderFinance,
  getWorkerIncomeSummary,
  getWorkerEarningList,
  adminGetFinanceLogs,
  adminGetWorkerEarnings,
  adminGetOrderFinanceDetail,
  mockUnlockSettlement,
  FINANCE_LOG_TYPE,
  FINANCE_LOG_DIRECTION,
  FINANCE_LOG_STATUS,
  WORKER_EARNING_STATUS,
  SETTLEMENT_STATUS,
  calculateFinance
}

