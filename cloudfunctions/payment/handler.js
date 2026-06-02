const ORDER_STATUS = Object.freeze({
  PENDING_PAY: 'pending_pay',
  PENDING_ACCEPT: 'pending_accept',
  CANCELED: 'canceled'
})

const PAY_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAYING: 'paying',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
})

const { success, fail, serviceError } = require('./_shared/response')
const { getPayload } = require('./_shared/payload')
const { getNow } = require('./_shared/time')

const PAY_MODE = Object.freeze({
  MOCK: 'mock',
  WECHAT: 'wechat'
})

const LOG_TYPE = Object.freeze({
  CREATE_PREPAY: 'create_prepay',
  REQUEST_PAYMENT: 'request_payment',
  PAY_NOTIFY: 'pay_notify',
  PAY_SUCCESS: 'pay_success',
  PAY_FAILED: 'pay_failed',
  DUPLICATE_PAY: 'duplicate_pay',
  DUPLICATE_NOTIFY: 'duplicate_notify',
  QUERY_PAYMENT: 'query_payment'
})

function requireOpenid(env = {}) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

function getPayMode(env = {}) {
  return env.payMode || (env.config && env.config.payMode) || PAY_MODE.MOCK
}

function getOrderAmount(order = {}) {
  return Number(order.pay_amount || order.price || 0)
}

function createOutTradeNo(order) {
  return order.out_trade_no || order.order_no || order._id
}

async function writePaymentLog(env, data) {
  if (!env.paymentLogs || !env.paymentLogs.create) {
    return null
  }

  return env.paymentLogs.create({
    ...data,
    created_at: data.created_at || getNow(env)
  })
}

function buildLogBase(order = {}) {
  return {
    order_id: order._id,
    order_no: order.order_no,
    user_id: order.user_id,
    out_trade_no: order.out_trade_no,
    transaction_id: order.transaction_id,
    prepay_id: order.prepay_id,
    amount: getOrderAmount(order)
  }
}

async function requireOwnedPayableOrder(orderId, env) {
  const openid = requireOpenid(env)
  if (!orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  if (order.user_id !== openid) {
    throw serviceError('PERMISSION_DENIED', '无权支付该订单')
  }

  if (order.pay_status === PAY_STATUS.PAID) {
    throw serviceError('ORDER_ALREADY_PAID', '订单已支付')
  }

  if (order.status !== ORDER_STATUS.PENDING_PAY) {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能支付')
  }

  if (![PAY_STATUS.UNPAID, PAY_STATUS.FAILED].includes(order.pay_status)) {
    throw serviceError('ORDER_PAYING', '订单支付处理中')
  }

  return order
}

async function createPayment(event = {}, env = {}) {
  if (getPayMode(env) !== PAY_MODE.WECHAT) {
    throw serviceError('REAL_PAY_DISABLED', '真实微信支付未启用')
  }

  if (!env.wechatPayClient || !env.wechatPayClient.createPrepay) {
    throw serviceError('WECHAT_PAY_CLIENT_MISSING', '缺少微信支付客户端配置')
  }

  const payload = getPayload(event)
  const order = await requireOwnedPayableOrder(payload.orderId, env)
  const now = getNow(env)
  const amount = getOrderAmount(order)
  const outTradeNo = createOutTradeNo(order)
  const prepayResult = await env.wechatPayClient.createPrepay({
    ...order,
    out_trade_no: outTradeNo,
    pay_amount: amount
  }, env)

  const updatedOrder = await env.orders.updateById(order._id, {
    out_trade_no: outTradeNo,
    prepay_id: prepayResult.prepay_id,
    pay_amount: amount,
    pay_status: PAY_STATUS.PAYING,
    pay_error: '',
    last_pay_attempt_at: now,
    updated_at: now
  })

  await writePaymentLog(env, {
    ...buildLogBase(updatedOrder),
    type: LOG_TYPE.CREATE_PREPAY,
    status: 'success',
    raw_data: {
      prepay_id: prepayResult.prepay_id,
      pay_mode: PAY_MODE.WECHAT
    }
  })

  return success({
    order: updatedOrder,
    amount,
    out_trade_no: outTradeNo,
    prepay_id: prepayResult.prepay_id,
    payParams: prepayResult.payParams
  })
}

function normalizeNotify(payload = {}) {
  return payload.notify || payload
}

function getNotifyAmount(notify = {}) {
  if (notify.amount && notify.amount.payer_total !== undefined) {
    return Number(notify.amount.payer_total)
  }
  return Number(notify.amount || 0)
}

async function safeCreatePaySuccessMessage(env, order, now) {
  if (!env.messages || !env.messages.create) {
    return null
  }

  return env.messages.create({
    user_id: order.user_id,
    role: 'user',
    related_type: 'order',
    related_id: order._id,
    is_read: false,
    title: '支付成功',
    content: '支付成功，订单已提交，等待师傅接单。',
    type: 'order_created',
    created_at: now,
    updated_at: now
  })
}

async function handlePayNotify(event = {}, env = {}) {
  const notify = normalizeNotify(getPayload(event))
  const now = getNow(env)
  await writePaymentLog(env, {
    out_trade_no: notify.out_trade_no,
    transaction_id: notify.transaction_id,
    type: LOG_TYPE.PAY_NOTIFY,
    status: 'success',
    amount: getNotifyAmount(notify),
    raw_data: notify,
    created_at: now
  })

  if (notify.trade_state && notify.trade_state !== 'SUCCESS') {
    await writePaymentLog(env, {
      out_trade_no: notify.out_trade_no,
      transaction_id: notify.transaction_id,
      type: LOG_TYPE.PAY_FAILED,
      status: 'failed',
      amount: getNotifyAmount(notify),
      raw_data: notify,
      error_code: notify.trade_state,
      error_message: notify.trade_state_desc || '支付未成功',
      created_at: now
    })
    return success({ paid: false })
  }

  const order = await env.orders.findByOutTradeNo(notify.out_trade_no)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '支付通知对应订单不存在')
  }

  if (order.pay_status === PAY_STATUS.PAID) {
    await writePaymentLog(env, {
      ...buildLogBase(order),
      transaction_id: notify.transaction_id || order.transaction_id,
      type: LOG_TYPE.DUPLICATE_NOTIFY,
      status: 'success',
      amount: getNotifyAmount(notify),
      raw_data: notify,
      created_at: now
    })
    return success({ duplicate: true, order })
  }

  const notifyAmount = getNotifyAmount(notify)
  const orderAmount = getOrderAmount(order)
  if (notifyAmount !== orderAmount) {
    await writePaymentLog(env, {
      ...buildLogBase(order),
      transaction_id: notify.transaction_id,
      type: LOG_TYPE.PAY_FAILED,
      status: 'failed',
      amount: notifyAmount,
      raw_data: notify,
      error_code: 'PAY_AMOUNT_MISMATCH',
      error_message: '支付金额与订单金额不一致',
      created_at: now
    })
    throw serviceError('PAY_AMOUNT_MISMATCH', '支付金额与订单金额不一致')
  }

  const paidData = {
    status: ORDER_STATUS.PENDING_ACCEPT,
    pay_status: PAY_STATUS.PAID,
    transaction_id: notify.transaction_id || '',
    paid_at: now,
    notify_received_at: now,
    updated_at: now
  }
  const updatedOrder = env.orders.markPaidIfUnpaid
    ? await env.orders.markPaidIfUnpaid(order._id, paidData)
    : await env.orders.updateById(order._id, paidData)

  if (!updatedOrder) {
    await writePaymentLog(env, {
      ...buildLogBase(order),
      transaction_id: notify.transaction_id,
      type: LOG_TYPE.DUPLICATE_NOTIFY,
      status: 'success',
      amount: notifyAmount,
      raw_data: notify,
      created_at: now
    })
    return success({ duplicate: true, order })
  }

  await safeCreatePaySuccessMessage(env, updatedOrder, now)
  await writePaymentLog(env, {
    ...buildLogBase(updatedOrder),
    type: LOG_TYPE.PAY_SUCCESS,
    status: 'success',
    amount: notifyAmount,
    raw_data: notify,
    created_at: now
  })

  return success({ order: updatedOrder })
}

async function queryPaymentStatus(event = {}, env = {}) {
  const payload = getPayload(event)
  const openid = requireOpenid(env)
  const order = await env.orders.findById(payload.orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }
  if (order.user_id !== openid) {
    throw serviceError('PERMISSION_DENIED', '无权查询该订单支付状态')
  }

  await writePaymentLog(env, {
    ...buildLogBase(order),
    type: LOG_TYPE.QUERY_PAYMENT,
    status: 'success',
    raw_data: {
      pay_status: order.pay_status,
      status: order.status
    }
  })

  return success({ order })
}

const actions = Object.freeze({
  createPayment,
  handlePayNotify,
  queryPaymentStatus
})

async function handlePayment(event = {}, env = {}) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知支付操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '支付操作失败')
  }
}

module.exports = {
  handlePayment,
  createPayment,
  handlePayNotify,
  queryPaymentStatus,
  PAY_MODE,
  PAY_STATUS,
  LOG_TYPE
}
