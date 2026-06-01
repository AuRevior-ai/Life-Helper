function success(data, message = 'success') {
  return {
    success: true,
    data,
    message
  }
}

function fail(errorCode, message) {
  return {
    success: false,
    errorCode,
    message
  }
}

function serviceError(errorCode, message) {
  const error = new Error(message)
  error.errorCode = errorCode
  return error
}

function getNow(env) {
  return env.now ? env.now() : new Date()
}

function getPayload(event = {}) {
  if (event.payload && typeof event.payload === 'object') {
    return event.payload
  }

  const { action, ...payload } = event
  return payload
}

function trimText(value) {
  return `${value || ''}`.trim()
}

async function safeCreateMessage(env, data) {
  if (!env.messages || !env.messages.create) {
    return null
  }

  try {
    return await env.messages.create({
      role: 'worker',
      related_type: 'order',
      is_read: false,
      ...data
    })
  } catch (error) {
    return null
  }
}

async function safeGenerateOrderFinance(env, orderId) {
  if (!env.finance || !env.finance.generateOrderFinance) {
    return null
  }

  try {
    return await env.finance.generateOrderFinance({
      orderId,
      source: 'mock_payment'
    })
  } catch (error) {
    return null
  }
}

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

function normalizeRating(value) {
  const rating = Number(value)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw serviceError('REVIEW_RATING_INVALID', '评分必须为 1-5 分')
  }
  return rating
}

async function requireReviewableOrder(orderId, env) {
  if (!orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  if (order.user_id !== requireOpenid(env)) {
    throw serviceError('PERMISSION_DENIED', '无权评价该订单')
  }

  if (order.status !== 'pending_review') {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能评价')
  }

  return order
}

async function createReview(event, env) {
  const payload = getPayload(event)
  const order = await requireReviewableOrder(payload.orderId, env)
  const existingReview = await env.reviews.findByOrderId(order._id)
  if (existingReview) {
    throw serviceError('REVIEW_ALREADY_EXISTS', '该订单已评价')
  }

  const now = getNow(env)
  const review = await env.reviews.create({
    order_id: order._id,
    user_id: order.user_id,
    worker_id: order.worker_id,
    service_id: order.service_id,
    service_name: order.service_name,
    rating: normalizeRating(payload.rating),
    content: trimText(payload.content),
    created_at: now,
    updated_at: now
  })
  if (!review) {
    throw serviceError('REVIEW_ALREADY_EXISTS', '该订单已评价')
  }

  const completeData = {
    status: 'completed',
    reviewed_at: now,
    updated_at: now
  }
  const updatedOrder = env.orders.completePendingReviewOrder
    ? await env.orders.completePendingReviewOrder(order._id, completeData)
    : await env.orders.updateById(order._id, completeData)

  if (!updatedOrder) {
    if (env.reviews.deleteById && review._id) {
      await env.reviews.deleteById(review._id)
    }
    throw serviceError('ORDER_STATUS_INVALID', '订单状态已变化，评价未完成')
  }

  await safeCreateMessage(env, {
    user_id: order.worker_id,
    title: '用户已完成评价',
    content: '用户已完成评价，订单已完成',
    type: 'order_completed',
    related_id: order._id,
    created_at: now,
    updated_at: now
  })

  await safeGenerateOrderFinance(env, order._id)

  return success({
    review,
    order: updatedOrder
  })
}

async function getOrderReview(event, env) {
  const payload = getPayload(event)
  if (!payload.orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const review = await env.reviews.findByOrderId(payload.orderId)
  return success({ review })
}

async function getWorkerReviews(event, env) {
  const payload = getPayload(event)
  const workerId = trimText(payload.workerId || requireOpenid(env))
  const reviews = await env.reviews.findByWorkerId(workerId)
  return success({ reviews })
}

const actions = Object.freeze({
  createReview,
  getOrderReview,
  getWorkerReviews
})

async function handleReview(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知评价操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '评价操作失败')
  }
}

module.exports = {
  handleReview,
  createReview,
  getOrderReview,
  getWorkerReviews
}
