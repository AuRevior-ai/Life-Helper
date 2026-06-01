const { findServiceSnapshotById } = require('./service-data')

const ORDER_STATUS = Object.freeze({
  PENDING_PAY: 'pending_pay',
  PENDING_ACCEPT: 'pending_accept',
  ACCEPTED: 'accepted',
  SERVING: 'serving',
  PENDING_REVIEW: 'pending_review',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
})

const PAY_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAYING: 'paying',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
})

const APPOINTMENT_TIME_SLOTS = Object.freeze([
  '09:00-11:00',
  '11:00-13:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00'
])

const MESSAGE_TYPE = Object.freeze({
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  SERVICE_STARTED: 'service_started',
  SERVICE_FINISHED: 'service_finished'
})

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

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

function requireText(value, errorCode, message) {
  const text = trimText(value)
  if (!text) {
    throw serviceError(errorCode, message)
  }
  return text
}

function parsePositiveInteger(value, fallback) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) {
    return fallback
  }
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
    orders: list,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total
  }
}

function isDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(trimText(value))
}

function toDateOnly(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeAppointment(payload, env) {
  const appointmentDate = trimText(payload.appointment_date || payload.appointmentDate)
  const appointmentSlot = trimText(payload.appointment_slot || payload.appointmentSlot)
  const legacyTime = trimText(payload.appointment_time || payload.appointmentTime)

  if (!appointmentDate && !appointmentSlot && legacyTime) {
    return {
      appointment_date: '',
      appointment_slot: '',
      appointment_time: legacyTime
    }
  }

  if (!appointmentDate || !appointmentSlot) {
    throw serviceError('APPOINTMENT_TIME_MISSING', '请选择预约日期和时间段')
  }

  if (!isDateOnly(appointmentDate) || !APPOINTMENT_TIME_SLOTS.includes(appointmentSlot)) {
    throw serviceError('APPOINTMENT_TIME_INVALID', '预约时间不合法')
  }

  if (appointmentDate < toDateOnly(getNow(env))) {
    throw serviceError('APPOINTMENT_TIME_INVALID', '不能选择过去时间')
  }

  return {
    appointment_date: appointmentDate,
    appointment_slot: appointmentSlot,
    appointment_time: `${appointmentDate} ${appointmentSlot}`
  }
}

async function safeCreateMessage(env, data) {
  if (!env.messages || !env.messages.create) {
    return null
  }

  try {
    return await env.messages.create({
      role: 'user',
      related_type: 'order',
      is_read: false,
      ...data
    })
  } catch (error) {
    return null
  }
}

async function callPromotion(env, action, payload) {
  if (!env.promotion || !env.promotion[action]) {
    return null
  }

  const result = await env.promotion[action](payload)
  if (result && result.success === false) {
    throw serviceError(result.errorCode || 'PROMOTION_ERROR', result.message || '营销优惠处理失败')
  }
  return result ? result.data : null
}

function buildDefaultPromotionSnapshot(service = {}) {
  const amount = Number(service.price || 0)
  return {
    original_amount: amount,
    member_discount_amount: 0,
    coupon_discount_amount: 0,
    total_discount_amount: 0,
    payable_amount: amount,
    promotion_source: 'none',
    member_snapshot: {
      level: '',
      discount_rate: 0,
      member_plan_id: ''
    },
    coupon_snapshot: {
      user_coupon_id: '',
      coupon_template_id: '',
      coupon_name: '',
      type: '',
      amount: 0,
      discount_rate: 0,
      threshold_amount: 0
    }
  }
}

function getSelectedCouponId(payload = {}) {
  return trimText(payload.userCouponId || payload.user_coupon_id)
}

async function calculatePromotionSnapshot(env, service, payload) {
  const userCouponId = getSelectedCouponId(payload)
  try {
    const promotionResult = await callPromotion(env, 'calculateOrderPromotion', {
      service,
      userCouponId
    })
    return promotionResult || buildDefaultPromotionSnapshot(service)
  } catch (error) {
    if (error.errorCode) {
      throw error
    }
    if (!userCouponId) {
      return buildDefaultPromotionSnapshot(service)
    }
    throw serviceError('PROMOTION_UNAVAILABLE', '优惠计算服务暂不可用，请稍后重试')
  }
}

async function safeUseCouponForOrder(env, order) {
  const userCouponId = order && order.coupon_snapshot && order.coupon_snapshot.user_coupon_id
  if (!userCouponId || !env.promotion || !env.promotion.useCouponForOrder) {
    return null
  }

  try {
    return await callPromotion(env, 'useCouponForOrder', {
      userCouponId,
      orderId: order._id
    })
  } catch (error) {
    return null
  }
}

async function safeReleaseCouponForOrder(env, order) {
  const userCouponId = order && order.coupon_snapshot && order.coupon_snapshot.user_coupon_id
  if (!userCouponId || !env.promotion || !env.promotion.releaseCouponForOrder) {
    return null
  }

  try {
    return await callPromotion(env, 'releaseCouponForOrder', {
      userCouponId,
      orderId: order._id
    })
  } catch (error) {
    return null
  }
}

function normalizeFinishImages(value) {
  if (!value) return []
  if (!Array.isArray(value)) {
    throw serviceError('FINISH_IMAGES_INVALID', '完工图片格式不正确')
  }
  const images = value.map((item) => trimText(item)).filter(Boolean)
  if (images.length > 3) {
    throw serviceError('FINISH_IMAGES_INVALID', '完工图片最多 3 张')
  }
  return images
}

function buildFullAddress(address = {}) {
  return [address.city, address.district, address.street, address.community, address.detail_address]
    .map((item) => trimText(item))
    .filter(Boolean)
    .join(' ')
}

function createDefaultOrderNo() {
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0')
  return `OD${Date.now()}${random}`
}

async function findServiceById(serviceId, env) {
  if (env.services && env.services.findById) {
    return env.services.findById(serviceId)
  }

  return findServiceSnapshotById(serviceId)
}

async function requireOwnedAddress(addressId, env) {
  const address = await env.addresses.findById(addressId)
  if (!address) {
    throw serviceError('ADDRESS_NOT_FOUND', '地址不存在')
  }

  if (address.user_id !== requireOpenid(env)) {
    throw serviceError('PERMISSION_DENIED', '无权使用该地址')
  }

  return address
}

async function requireOwnedOrder(orderId, env) {
  if (!orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  if (order.user_id !== requireOpenid(env)) {
    throw serviceError('PERMISSION_DENIED', '无权操作该订单')
  }

  return order
}

async function requireRelatedOrder(orderId, env) {
  if (!orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  const openid = requireOpenid(env)
  if (order.user_id !== openid && order.worker_id !== openid) {
    throw serviceError('PERMISSION_DENIED', '无权查看该订单')
  }

  return order
}

async function requireApprovedWorker(env) {
  const openid = requireOpenid(env)
  if (!env.workers || !env.workers.findByUserId) {
    throw serviceError('WORKER_REPOSITORY_MISSING', '缺少师傅信息')
  }

  const worker = await env.workers.findByUserId(openid)
  if (!worker || worker.audit_status !== 'approved') {
    throw serviceError('WORKER_NOT_APPROVED', '当前师傅尚未通过审核')
  }
  if (worker.status && worker.status !== 'enabled') {
    throw serviceError('WORKER_DISABLED', '当前师傅账号不可接单')
  }
  if (worker.online_status && worker.online_status !== 'available') {
    throw serviceError('WORKER_PAUSED', '当前师傅已暂停接单')
  }

  return worker
}

async function requireAssignedWorkerOrder(orderId, env) {
  await requireApprovedWorker(env)

  if (!orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  if (order.worker_id !== requireOpenid(env)) {
    throw serviceError('PERMISSION_DENIED', '无权操作该订单')
  }

  return order
}

async function createOrder(event, env) {
  const userId = requireOpenid(env)
  const payload = getPayload(event)
  const serviceId = requireText(payload.serviceId, 'SERVICE_ID_MISSING', '缺少服务 ID')
  const addressId = requireText(payload.addressId, 'ADDRESS_ID_MISSING', '缺少地址 ID')
  const appointment = normalizeAppointment(payload, env)
  const service = await findServiceById(serviceId, env)
  if (!service) {
    throw serviceError('SERVICE_NOT_FOUND', '服务不存在或已下架')
  }

  const address = await requireOwnedAddress(addressId, env)
  const now = getNow(env)
  const orderNoFactory = env.orderNoFactory || createDefaultOrderNo
  const promotionSnapshot = await calculatePromotionSnapshot(env, service, payload)
  const order = await env.orders.create({
    order_no: orderNoFactory(),
    user_id: userId,
    worker_id: '',
    service_id: service._id,
    service_name: service.name,
    service_duration: service.duration || '',
    category_id: service.category_id,
    category_name: service.category_name,
    price: promotionSnapshot.original_amount,
    original_amount: promotionSnapshot.original_amount,
    member_discount_amount: promotionSnapshot.member_discount_amount,
    coupon_discount_amount: promotionSnapshot.coupon_discount_amount,
    total_discount_amount: promotionSnapshot.total_discount_amount,
    payable_amount: promotionSnapshot.payable_amount,
    promotion_source: promotionSnapshot.promotion_source,
    member_snapshot: promotionSnapshot.member_snapshot,
    coupon_snapshot: promotionSnapshot.coupon_snapshot,
    address_id: address._id,
    service_area_id: address.service_area_id || '',
    contact_name: address.contact_name,
    contact_phone: address.phone,
    city: address.city,
    district: address.district || '',
    street: address.street || '',
    community: address.community,
    detail_address: address.detail_address,
    full_address: buildFullAddress(address),
    appointment_date: appointment.appointment_date,
    appointment_slot: appointment.appointment_slot,
    appointment_time: appointment.appointment_time,
    remark: trimText(payload.remark),
    out_trade_no: '',
    transaction_id: '',
    prepay_id: '',
    pay_amount: Number(promotionSnapshot.payable_amount || 0),
    status: ORDER_STATUS.PENDING_PAY,
    pay_status: PAY_STATUS.UNPAID,
    paid_at: null,
    pay_error: '',
    notify_received_at: null,
    last_pay_attempt_at: null,
    after_sale_status: 'none',
    refund_status: 'none',
    refund_amount: 0,
    refunded_at: null,
    after_sale_id: '',
    refund_no: '',
    created_at: now,
    updated_at: now
  })

  const userCouponId = promotionSnapshot.coupon_snapshot && promotionSnapshot.coupon_snapshot.user_coupon_id
  if (userCouponId) {
    try {
      await callPromotion(env, 'lockCouponForOrder', {
        userCouponId,
        orderId: order._id
      })
    } catch (error) {
      await env.orders.updateById(order._id, {
        status: ORDER_STATUS.CANCELED,
        cancel_reason: '优惠券锁定失败',
        canceled_at: now,
        updated_at: now
      })
      throw error
    }
  }

  return success({ order })
}

async function mockPayOrder(event, env) {
  const payload = getPayload(event)
  const order = await requireOwnedOrder(payload.orderId, env)

  if (order.status !== ORDER_STATUS.PENDING_PAY || order.pay_status !== PAY_STATUS.UNPAID) {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能支付')
  }

  const now = getNow(env)
  const updatedOrder = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.PENDING_ACCEPT,
    pay_status: PAY_STATUS.PAID,
    paid_at: now,
    updated_at: now
  })

  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: '订单已提交',
    content: '订单已提交，等待师傅接单',
    type: MESSAGE_TYPE.ORDER_CREATED,
    related_id: order._id,
    created_at: now,
    updated_at: now
  })

  await safeUseCouponForOrder(env, updatedOrder)

  return success({ order: updatedOrder })
}

async function getUserOrderList(event, env) {
  const userId = requireOpenid(env)
  const payload = getPayload(event)
  let orders = await env.orders.findByUserId(userId)

  if (payload.status) {
    orders = orders.filter((order) => order.status === payload.status)
  }

  return success(paginateList(orders, payload))
}

async function getWorkerOrderList(event, env) {
  await requireApprovedWorker(env)
  const payload = getPayload(event)
  let orders = await env.orders.findByWorkerId(requireOpenid(env))

  if (payload.status) {
    orders = orders.filter((order) => order.status === payload.status)
  }

  return success(paginateList(orders, payload))
}

async function acceptOrder(event, env) {
  await requireApprovedWorker(env)
  const payload = getPayload(event)
  if (!payload.orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(payload.orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  if (order.worker_id) {
    throw serviceError('ORDER_ALREADY_ACCEPTED', '该订单已被其他师傅接走')
  }

  if (order.status !== ORDER_STATUS.PENDING_ACCEPT) {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能接单')
  }

  const now = getNow(env)
  const updateData = {
    status: ORDER_STATUS.ACCEPTED,
    accepted_at: now,
    updated_at: now
  }
  const workerId = requireOpenid(env)
  const updatedOrder = env.orders.acceptPendingOrder
    ? await env.orders.acceptPendingOrder(order._id, workerId, updateData)
    : await env.orders.updateById(order._id, {
      ...updateData,
      worker_id: workerId
    })

  if (!updatedOrder) {
    throw serviceError('ORDER_ALREADY_ACCEPTED', '该订单已被其他师傅接走')
  }

  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: '师傅已接单',
    content: '师傅已接单，请保持电话畅通',
    type: MESSAGE_TYPE.ORDER_ACCEPTED,
    related_id: order._id,
    created_at: now,
    updated_at: now
  })

  if (env.dispatchLogs && env.dispatchLogs.create) {
    await env.dispatchLogs.create({
      order_id: order._id,
      order_no: order.order_no || '',
      action: 'worker_accept',
      operator_id: workerId,
      operator_role: 'worker',
      from_worker_id: '',
      to_worker_id: workerId,
      from_status: ORDER_STATUS.PENDING_ACCEPT,
      to_status: ORDER_STATUS.ACCEPTED,
      reason: '师傅主动接单',
      created_at: now
    })
  }

  return success({ order: updatedOrder })
}

async function startService(event, env) {
  const payload = getPayload(event)
  const order = await requireAssignedWorkerOrder(payload.orderId, env)

  if (order.status !== ORDER_STATUS.ACCEPTED) {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能开始服务')
  }

  const now = getNow(env)
  const updatedOrder = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.SERVING,
    started_at: now,
    updated_at: now
  })

  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: '师傅已开始服务',
    content: '师傅已开始服务',
    type: MESSAGE_TYPE.SERVICE_STARTED,
    related_id: order._id,
    created_at: now,
    updated_at: now
  })

  return success({ order: updatedOrder })
}

async function finishService(event, env) {
  const payload = getPayload(event)
  const order = await requireAssignedWorkerOrder(payload.orderId, env)

  if (order.status !== ORDER_STATUS.SERVING) {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能完成服务')
  }

  const finishRemark = requireText(
    payload.finish_remark || payload.finishRemark,
    'FINISH_REMARK_MISSING',
    '请填写完工说明'
  )
  const finishImages = normalizeFinishImages(payload.finish_images || payload.finishImages)
  const now = getNow(env)
  const updatedOrder = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.PENDING_REVIEW,
    finish_remark: finishRemark,
    finish_images: finishImages,
    finished_at: now,
    updated_at: now
  })

  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: '服务已完成',
    content: '服务已完成，请确认并评价',
    type: MESSAGE_TYPE.SERVICE_FINISHED,
    related_id: order._id,
    created_at: now,
    updated_at: now
  })

  return success({ order: updatedOrder })
}

async function getWorkerIncomeStats(event, env) {
  await requireApprovedWorker(env)
  const orders = await env.orders.findByWorkerId(requireOpenid(env))
  const completedOrders = orders.filter((order) => order.status === ORDER_STATUS.COMPLETED)
  const totalAmount = completedOrders.reduce((sum, order) => sum + Number(order.price || 0), 0)

  return success({
    completed_count: completedOrders.length,
    total_amount: totalAmount,
    orders: completedOrders
  })
}

async function getOrderDetail(event, env) {
  const payload = getPayload(event)
  const order = await requireRelatedOrder(payload.orderId, env)
  return success({ order })
}

async function cancelOrder(event, env) {
  const payload = getPayload(event)
  const order = await requireOwnedOrder(payload.orderId, env)

  if (![ORDER_STATUS.PENDING_PAY, ORDER_STATUS.PENDING_ACCEPT].includes(order.status)) {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能取消')
  }

  const now = getNow(env)
  const updatedOrder = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.CANCELED,
    canceled_at: now,
    updated_at: now
  })

  await safeReleaseCouponForOrder(env, order)

  return success({ order: updatedOrder })
}

const actions = Object.freeze({
  createOrder,
  mockPayOrder,
  getUserOrderList,
  getWorkerOrderList,
  getOrderDetail,
  cancelOrder,
  acceptOrder,
  startService,
  finishService,
  getWorkerIncomeStats
})

async function handleOrder(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知订单操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '订单操作失败')
  }
}

module.exports = {
  handleOrder,
  createOrder,
  mockPayOrder,
  getUserOrderList,
  getWorkerOrderList,
  getOrderDetail,
  cancelOrder,
  acceptOrder,
  startService,
  finishService,
  getWorkerIncomeStats,
  ORDER_STATUS,
  PAY_STATUS
}
