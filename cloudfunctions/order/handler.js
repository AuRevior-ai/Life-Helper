const { findServiceSnapshotById } = require('./service-data')

const ORDER_STATUS = Object.freeze({
  PENDING_PAY: 'pending_pay',
  PENDING_ACCEPT: 'pending_accept',
  ACCEPTED: 'accepted',
  CANCELED: 'canceled'
})

const PAY_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid'
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

function buildFullAddress(address = {}) {
  return [address.city, address.community, address.detail_address]
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

  return worker
}

async function createOrder(event, env) {
  const userId = requireOpenid(env)
  const payload = getPayload(event)
  const serviceId = requireText(payload.serviceId, 'SERVICE_ID_MISSING', '缺少服务 ID')
  const addressId = requireText(payload.addressId, 'ADDRESS_ID_MISSING', '缺少地址 ID')
  const appointmentTime = requireText(
    payload.appointment_time || payload.appointmentTime,
    'APPOINTMENT_TIME_MISSING',
    '请填写预约时间'
  )
  const service = await findServiceById(serviceId, env)
  if (!service) {
    throw serviceError('SERVICE_NOT_FOUND', '服务不存在或已下架')
  }

  const address = await requireOwnedAddress(addressId, env)
  const now = getNow(env)
  const orderNoFactory = env.orderNoFactory || createDefaultOrderNo
  const order = await env.orders.create({
    order_no: orderNoFactory(),
    user_id: userId,
    worker_id: '',
    service_id: service._id,
    service_name: service.name,
    service_duration: service.duration || '',
    category_id: service.category_id,
    category_name: service.category_name,
    price: service.price,
    address_id: address._id,
    contact_name: address.contact_name,
    contact_phone: address.phone,
    city: address.city,
    community: address.community,
    detail_address: address.detail_address,
    full_address: buildFullAddress(address),
    appointment_time: appointmentTime,
    remark: trimText(payload.remark),
    status: ORDER_STATUS.PENDING_PAY,
    pay_status: PAY_STATUS.UNPAID,
    created_at: now,
    updated_at: now
  })

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

  return success({ order: updatedOrder })
}

async function getUserOrderList(event, env) {
  const userId = requireOpenid(env)
  const payload = getPayload(event)
  let orders = await env.orders.findByUserId(userId)

  if (payload.status) {
    orders = orders.filter((order) => order.status === payload.status)
  }

  return success({ orders })
}

async function getWorkerOrderList(event, env) {
  await requireApprovedWorker(env)
  const orders = await env.orders.findByWorkerId(requireOpenid(env))
  return success({ orders })
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

  if (order.status !== ORDER_STATUS.PENDING_ACCEPT || order.worker_id) {
    throw serviceError('ORDER_STATUS_INVALID', '当前订单不能接单')
  }

  const now = getNow(env)
  const updatedOrder = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.ACCEPTED,
    worker_id: requireOpenid(env),
    accepted_at: now,
    updated_at: now
  })

  return success({ order: updatedOrder })
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

  return success({ order: updatedOrder })
}

const actions = Object.freeze({
  createOrder,
  mockPayOrder,
  getUserOrderList,
  getWorkerOrderList,
  getOrderDetail,
  cancelOrder,
  acceptOrder
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
  ORDER_STATUS,
  PAY_STATUS
}
