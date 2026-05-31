const USER_ROLE = Object.freeze({ ADMIN: 'admin' })
const USER_STATUS = Object.freeze({ NORMAL: 'normal', DISABLED: 'disabled' })
const ORDER_STATUS = Object.freeze({
  PENDING_ACCEPT: 'pending_accept',
  ACCEPTED: 'accepted'
})
const WORKER_STATUS = Object.freeze({ ENABLED: 'enabled' })
const WORKER_ONLINE_STATUS = Object.freeze({ AVAILABLE: 'available' })

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

function splitKeywords(value) {
  return trimText(value)
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasTextMatch(left, right) {
  const leftItems = splitKeywords(left)
  const rightItems = splitKeywords(right)
  if (!leftItems.length || !rightItems.length) return false
  return leftItems.some((leftItem) =>
    rightItems.some((rightItem) => leftItem === rightItem || leftItem.includes(rightItem) || rightItem.includes(leftItem))
  )
}

function workerMatchesCategory(worker, order) {
  return hasTextMatch(worker.service_category || worker.serviceCategory, order.category_name || order.category_id)
}

function workerMatchesArea(worker, order) {
  const workerCommunities = Array.isArray(worker.service_communities)
    ? worker.service_communities.map((item) => trimText(item)).filter(Boolean)
    : []
  if (workerCommunities.length) {
    return Boolean(trimText(order.community)) && workerCommunities.includes(trimText(order.community))
  }
  return hasTextMatch(worker.service_area || worker.serviceArea, [order.community, order.city, order.full_address].filter(Boolean).join(' '))
}

function isWorkerAssignable(worker, order) {
  return Boolean(
    worker &&
    worker.audit_status === 'approved' &&
    (!worker.status || worker.status === WORKER_STATUS.ENABLED) &&
    (!worker.online_status || worker.online_status === WORKER_ONLINE_STATUS.AVAILABLE) &&
    workerMatchesCategory(worker, order) &&
    workerMatchesArea(worker, order)
  )
}

function requireOpenid(env) {
  if (!env.openid) throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  return env.openid
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

async function requireOrder(orderId, env) {
  if (!orderId) throw serviceError('ORDER_ID_MISSING', '缺少订单 ID')
  const order = await env.orders.findById(orderId)
  if (!order) throw serviceError('ORDER_NOT_FOUND', '订单不存在')
  return order
}

async function createMessage(env, data) {
  if (!env.messages || !env.messages.create) return null
  try {
    return await env.messages.create({
      related_type: 'order',
      is_read: false,
      ...data
    })
  } catch (error) {
    return null
  }
}

async function getAssignableWorkers(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const order = await requireOrder(payload.orderId, env)
  const workers = await env.workers.findAll()
  return success({
    workers: workers.filter((worker) => isWorkerAssignable(worker, order))
  })
}

async function adminAssignOrder(event, env) {
  const admin = await requireAdmin(env)
  const payload = getPayload(event)
  const order = await requireOrder(payload.orderId, env)
  if (order.status !== ORDER_STATUS.PENDING_ACCEPT) {
    throw serviceError('ORDER_STATUS_INVALID', '只能指派待接单订单')
  }
  if (order.worker_id) {
    throw serviceError('ORDER_ALREADY_ACCEPTED', '该订单已被其他师傅接走')
  }
  if (!payload.workerId) {
    throw serviceError('WORKER_ID_MISSING', '缺少师傅 ID')
  }
  const worker = await env.workers.findById(payload.workerId)
  if (!isWorkerAssignable(worker, order)) {
    throw serviceError('WORKER_NOT_ASSIGNABLE', '师傅不符合派单条件')
  }

  const now = getNow(env)
  const updateData = {
    status: ORDER_STATUS.ACCEPTED,
    accepted_at: now,
    updated_at: now
  }
  const updatedOrder = env.orders.acceptPendingOrder
    ? await env.orders.acceptPendingOrder(order._id, worker.user_id, updateData)
    : await env.orders.updateById(order._id, { ...updateData, worker_id: worker.user_id })
  if (!updatedOrder) {
    throw serviceError('ORDER_ALREADY_ACCEPTED', '该订单已被其他师傅接走')
  }

  const reason = trimText(payload.reason) || '管理员人工派单'
  await env.dispatchLogs.create({
    order_id: order._id,
    order_no: order.order_no || '',
    action: 'admin_assign',
    operator_id: admin.openid || requireOpenid(env),
    operator_role: 'admin',
    from_worker_id: order.worker_id || '',
    to_worker_id: worker.user_id,
    from_status: order.status,
    to_status: ORDER_STATUS.ACCEPTED,
    reason,
    created_at: now
  })
  if (env.adminOperationLogs && env.adminOperationLogs.create) {
    await env.adminOperationLogs.create({
      admin_id: admin.openid || requireOpenid(env),
      order_id: order._id,
      from_status: order.status,
      to_status: ORDER_STATUS.ACCEPTED,
      reason,
      force: false,
      created_at: now
    })
  }
  await createMessage(env, {
    user_id: order.user_id,
    role: 'user',
    title: '订单已指派师傅',
    content: '平台已为你的订单指派师傅',
    type: 'order_accepted',
    related_id: order._id,
    created_at: now,
    updated_at: now
  })
  await createMessage(env, {
    user_id: worker.user_id,
    role: 'worker',
    title: '收到指派订单',
    content: '管理员为你指派了新订单',
    type: 'order_accepted',
    related_id: order._id,
    created_at: now,
    updated_at: now
  })

  return success({ order: updatedOrder })
}

async function adminUnassignOrder(event, env) {
  const admin = await requireAdmin(env)
  const payload = getPayload(event)
  const reason = trimText(payload.reason)
  if (!reason) {
    throw serviceError('DISPATCH_REASON_REQUIRED', '请填写取消指派原因')
  }
  const order = await requireOrder(payload.orderId, env)
  if (order.status !== ORDER_STATUS.ACCEPTED) {
    throw serviceError('ORDER_STATUS_INVALID', '只有已接单且未开始服务的订单可以回流')
  }
  const now = getNow(env)
  const fromWorkerId = order.worker_id || ''
  const updatedOrder = await env.orders.updateById(order._id, {
    worker_id: '',
    status: ORDER_STATUS.PENDING_ACCEPT,
    accepted_at: null,
    updated_at: now
  })
  await env.dispatchLogs.create({
    order_id: order._id,
    order_no: order.order_no || '',
    action: 'admin_unassign',
    operator_id: admin.openid || requireOpenid(env),
    operator_role: 'admin',
    from_worker_id: fromWorkerId,
    to_worker_id: '',
    from_status: ORDER_STATUS.ACCEPTED,
    to_status: ORDER_STATUS.PENDING_ACCEPT,
    reason,
    created_at: now
  })
  if (env.adminOperationLogs && env.adminOperationLogs.create) {
    await env.adminOperationLogs.create({
      admin_id: admin.openid || requireOpenid(env),
      order_id: order._id,
      from_status: ORDER_STATUS.ACCEPTED,
      to_status: ORDER_STATUS.PENDING_ACCEPT,
      reason,
      force: false,
      created_at: now
    })
  }
  await createMessage(env, {
    user_id: order.user_id,
    role: 'user',
    title: '订单已回流接单大厅',
    content: reason,
    type: 'order_created',
    related_id: order._id,
    created_at: now,
    updated_at: now
  })
  if (fromWorkerId) {
    await createMessage(env, {
      user_id: fromWorkerId,
      role: 'worker',
      title: '订单指派已取消',
      content: reason,
      type: 'system',
      related_id: order._id,
      created_at: now,
      updated_at: now
    })
  }
  return success({ order: updatedOrder })
}

async function getDispatchLogs(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const logs = payload.orderId && env.dispatchLogs.findByOrderId
    ? await env.dispatchLogs.findByOrderId(payload.orderId)
    : await env.dispatchLogs.findAll()
  return success({ logs })
}

const actions = Object.freeze({
  getAssignableWorkers,
  adminAssignOrder,
  adminUnassignOrder,
  getDispatchLogs
})

async function handleDispatch(event = {}, env) {
  const action = actions[event.action]
  if (!action) return fail('ACTION_NOT_FOUND', '未知派单操作')
  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '派单操作失败')
  }
}

module.exports = {
  handleDispatch,
  getAssignableWorkers,
  adminAssignOrder,
  adminUnassignOrder,
  getDispatchLogs,
  isWorkerAssignable
}
