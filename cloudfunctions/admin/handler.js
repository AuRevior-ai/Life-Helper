const USER_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled'
})

const USER_ROLE = Object.freeze({
  ADMIN: 'admin'
})

const ORDER_STATUS = Object.freeze({
  PENDING_PAY: 'pending_pay',
  PENDING_ACCEPT: 'pending_accept',
  ACCEPTED: 'accepted',
  SERVING: 'serving',
  PENDING_REVIEW: 'pending_review',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
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

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

function trimText(value) {
  return `${value || ''}`.trim()
}

async function requireAdmin(env) {
  const user = await env.users.findByOpenid(requireOpenid(env))
  if (!user || user.status === USER_STATUS.DISABLED) {
    throw serviceError('USER_NOT_FOUND', '管理员用户不存在或已禁用')
  }

  if (user.role !== USER_ROLE.ADMIN) {
    throw serviceError('PERMISSION_DENIED', '当前操作需要管理员权限')
  }

  return user
}

function isValidOrderStatus(status) {
  return Object.values(ORDER_STATUS).includes(status)
}

const ORDER_STATUS_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING_PAY]: [ORDER_STATUS.PENDING_ACCEPT, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.PENDING_ACCEPT]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.SERVING, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.SERVING]: [ORDER_STATUS.PENDING_REVIEW, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.PENDING_REVIEW]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELED]: []
})

function canTransitOrderStatus(fromStatus, toStatus) {
  return (ORDER_STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus)
}

async function getDashboard(event, env) {
  await requireAdmin(env)
  const [users, orders, pendingWorkers] = await Promise.all([
    env.users.findAll(),
    env.orders.findAll(),
    env.workers.findByAuditStatus('pending')
  ])
  const completedOrderAmount = orders
    .filter((order) => order.status === ORDER_STATUS.COMPLETED)
    .reduce((sum, order) => sum + Number(order.price || 0), 0)

  return success({
    stats: {
      user_count: users.length,
      order_count: orders.length,
      pending_worker_count: pendingWorkers.length,
      completed_order_amount: completedOrderAmount
    }
  })
}

async function getAllUsers(event, env) {
  await requireAdmin(env)
  const users = await env.users.findAll()
  return success({ users })
}

async function disableUser(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.userId) {
    throw serviceError('USER_ID_MISSING', '缺少用户 ID')
  }

  const user = await env.users.updateById(payload.userId, {
    status: USER_STATUS.DISABLED,
    updated_at: getNow(env)
  })
  if (!user) {
    throw serviceError('USER_NOT_FOUND', '用户不存在')
  }

  return success({ user })
}

async function getAllOrders(event, env) {
  await requireAdmin(env)
  const orders = await env.orders.findAll()
  return success({ orders })
}

async function getOrderDetail(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }

  const order = await env.orders.findById(payload.orderId)
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  return success({ order })
}

async function adminUpdateOrderStatus(event, env) {
  const admin = await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.orderId) {
    throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  }
  if (!isValidOrderStatus(payload.status)) {
    throw serviceError('ORDER_STATUS_INVALID', '订单状态不合法')
  }
  if (!env.adminOperationLogs || !env.adminOperationLogs.create) {
    throw serviceError('ADMIN_LOG_REPOSITORY_MISSING', '缺少管理员操作日志集合')
  }

  const existingOrder = await env.orders.findById(payload.orderId)
  if (!existingOrder) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  const force = payload.force === true
  if (existingOrder.status !== payload.status && !force && !canTransitOrderStatus(existingOrder.status, payload.status)) {
    throw serviceError('ORDER_STATUS_TRANSITION_INVALID', '订单状态流转不合法')
  }

  const now = getNow(env)
  const order = await env.orders.updateById(payload.orderId, {
    status: payload.status,
    updated_at: now
  })
  if (!order) {
    throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  }

  await env.adminOperationLogs.create({
    admin_id: admin.openid || requireOpenid(env),
    order_id: payload.orderId,
    from_status: existingOrder.status,
    to_status: payload.status,
    reason: trimText(payload.reason) || (force ? '调试强制调整' : '管理员状态调整'),
    force,
    created_at: now
  })

  return success({ order })
}

async function getOrderStats(event, env) {
  await requireAdmin(env)
  const orders = await env.orders.findAll()
  const status_counts = orders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1
    return counts
  }, {})
  return success({
    total: orders.length,
    status_counts
  })
}

async function getServiceStats(event, env) {
  await requireAdmin(env)
  const [categories, services] = await Promise.all([
    env.categories.findAll(),
    env.services.findAll()
  ])
  return success({
    category_count: categories.length,
    service_count: services.length,
    on_service_count: services.filter((service) => service.status === 'on').length
  })
}

const actions = Object.freeze({
  getDashboard,
  getAllUsers,
  disableUser,
  getAllOrders,
  getOrderDetail,
  adminUpdateOrderStatus,
  getOrderStats,
  getServiceStats
})

async function handleAdmin(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知管理员操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '管理员操作失败')
  }
}

module.exports = {
  handleAdmin,
  getDashboard,
  getAllUsers,
  disableUser,
  getAllOrders,
  getOrderDetail,
  adminUpdateOrderStatus,
  getOrderStats,
  getServiceStats
}
