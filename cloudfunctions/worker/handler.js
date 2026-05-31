const WORKER_AUDIT_STATUS = Object.freeze({
  NOT_APPLIED: 'not_applied',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
})

const WORKER_STATUS = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
})

const WORKER_ONLINE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  PAUSED: 'paused',
  BUSY: 'busy'
})

const USER_ROLE = Object.freeze({
  USER: 'user',
  WORKER: 'worker',
  ADMIN: 'admin'
})

const USER_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled'
})

const REQUIRED_WORKER_FIELDS = ['name', 'phone', 'service_category', 'service_area']

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

function splitKeywords(value) {
  return trimText(value)
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasTextMatch(left, right) {
  const leftItems = splitKeywords(left)
  const rightItems = splitKeywords(right)
  if (leftItems.length === 0 || rightItems.length === 0) {
    return false
  }

  return leftItems.some((leftItem) =>
    rightItems.some((rightItem) => leftItem === rightItem || leftItem.includes(rightItem) || rightItem.includes(leftItem))
  )
}

function orderMatchesWorkerCategory(order, worker) {
  const workerCategory = worker.service_category || worker.serviceCategory
  return hasTextMatch(workerCategory, order.category_name || order.category_id || order.service_category)
}

function getOrderAreaText(order) {
  return [order.service_area, order.community, order.city, order.full_address]
    .map((item) => trimText(item))
    .filter(Boolean)
    .join(' ')
}

function orderMatchesWorkerArea(order, worker) {
  const orderCommunity = trimText(order.community)
  const workerCommunities = Array.isArray(worker.service_communities)
    ? worker.service_communities.map((item) => trimText(item)).filter(Boolean)
    : []
  if (workerCommunities.length > 0) {
    return Boolean(orderCommunity) && workerCommunities.includes(orderCommunity)
  }

  const orderArea = getOrderAreaText(order)
  const workerArea = worker.service_area || worker.serviceArea
  if (!trimText(orderArea) || !trimText(workerArea)) {
    return false
  }
  return hasTextMatch(workerArea, orderArea)
}

async function safeCreateMessage(env, data) {
  if (!env.messages || !env.messages.create) {
    return null
  }

  try {
    return await env.messages.create({
      role: 'worker',
      related_type: 'worker',
      is_read: false,
      ...data
    })
  } catch (error) {
    return null
  }
}

function isPhone(value) {
  return /^1[3-9]\d{9}$/.test(trimText(value))
}

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

function normalizeWorkerPayload(payload = {}) {
  const serviceAreaIds = Array.isArray(payload.service_area_ids || payload.serviceAreaIds)
    ? (payload.service_area_ids || payload.serviceAreaIds).map((item) => trimText(item)).filter(Boolean)
    : []
  const serviceCommunities = Array.isArray(payload.service_communities || payload.serviceCommunities)
    ? (payload.service_communities || payload.serviceCommunities).map((item) => trimText(item)).filter(Boolean)
    : splitKeywords(payload.service_area || payload.serviceArea)
  return {
    name: trimText(payload.name),
    phone: trimText(payload.phone),
    service_category: trimText(payload.service_category || payload.serviceCategory),
    service_area: trimText(payload.service_area || payload.serviceArea),
    service_area_ids: serviceAreaIds,
    service_communities: serviceCommunities,
    service_city: trimText(payload.service_city || payload.serviceCity),
    service_districts: Array.isArray(payload.service_districts || payload.serviceDistricts)
      ? (payload.service_districts || payload.serviceDistricts).map((item) => trimText(item)).filter(Boolean)
      : [],
    intro: trimText(payload.intro),
    qualification_images: Array.isArray(payload.qualification_images)
      ? payload.qualification_images
      : []
  }
}

async function loadEnabledAreas(areaIds, env) {
  if (!areaIds.length) {
    return []
  }
  if (!env.areas || !env.areas.findById) {
    throw serviceError('SERVICE_AREA_REPOSITORY_MISSING', '缺少服务区域集合')
  }
  const areas = []
  for (const areaId of areaIds) {
    const area = await env.areas.findById(areaId)
    if (!area) {
      throw serviceError('SERVICE_AREA_NOT_FOUND', '服务区域不存在')
    }
    if (area.status === 'disabled') {
      throw serviceError('SERVICE_AREA_DISABLED', '服务区域已禁用')
    }
    areas.push(area)
  }
  return areas
}

async function enrichWorkerAreas(payload, env) {
  const areas = await loadEnabledAreas(payload.service_area_ids, env)
  if (!areas.length) {
    return payload
  }
  const communities = areas.map((area) => trimText(area.community)).filter(Boolean)
  const districts = Array.from(new Set(areas.map((area) => trimText(area.district)).filter(Boolean)))
  return {
    ...payload,
    service_communities: communities,
    service_area: communities.join('、'),
    service_city: trimText(areas[0].city) || payload.service_city,
    service_districts: districts
  }
}

function validateWorkerPayload(payload) {
  const missing = REQUIRED_WORKER_FIELDS.filter((field) => !payload[field])
  if (missing.length > 0) {
    throw serviceError('WORKER_REQUIRED', '请填写完整入驻信息')
  }

  if (!isPhone(payload.phone)) {
    throw serviceError('WORKER_PHONE_INVALID', '手机号格式不正确')
  }
}

async function requireCurrentUser(env) {
  const openid = requireOpenid(env)
  const user = await env.users.findByOpenid(openid)
  if (!user) {
    throw serviceError('USER_NOT_FOUND', '用户不存在')
  }

  if (user.status === USER_STATUS.DISABLED) {
    throw serviceError('USER_DISABLED', '当前用户已被禁用')
  }

  return user
}

async function requireAdmin(env) {
  const user = await requireCurrentUser(env)
  if (user.role !== USER_ROLE.ADMIN) {
    throw serviceError('PERMISSION_DENIED', '当前操作需要管理员权限')
  }
  return user
}

async function requireApprovedWorker(env) {
  const openid = requireOpenid(env)
  const worker = await env.workers.findByUserId(openid)
  if (!worker || worker.audit_status !== WORKER_AUDIT_STATUS.APPROVED) {
    throw serviceError('WORKER_NOT_APPROVED', '当前师傅尚未通过审核')
  }
  return worker
}

async function requireWorkerById(workerId, env) {
  if (!workerId) {
    throw serviceError('WORKER_ID_MISSING', '缺少师傅 ID')
  }

  const worker = await env.workers.findById(workerId)
  if (!worker) {
    throw serviceError('WORKER_NOT_FOUND', '师傅申请不存在')
  }

  return worker
}

async function applyWorker(event, env) {
  const userId = requireOpenid(env)
  const payload = await enrichWorkerAreas(normalizeWorkerPayload(getPayload(event)), env)
  validateWorkerPayload(payload)

  const now = getNow(env)
  const existingWorker = await env.workers.findByUserId(userId)
  if (existingWorker && existingWorker.audit_status === WORKER_AUDIT_STATUS.APPROVED) {
    throw serviceError('WORKER_ALREADY_APPROVED', '师傅已通过审核')
  }

  if (existingWorker) {
    const worker = await env.workers.updateById(existingWorker._id, {
      ...payload,
      audit_status: WORKER_AUDIT_STATUS.PENDING,
      status: WORKER_STATUS.DISABLED,
      online_status: existingWorker.online_status || WORKER_ONLINE_STATUS.AVAILABLE,
      reject_reason: '',
      updated_at: now
    })
    return success({ worker })
  }

  const worker = await env.workers.create({
    ...payload,
    user_id: userId,
    audit_status: WORKER_AUDIT_STATUS.PENDING,
    status: WORKER_STATUS.DISABLED,
    online_status: WORKER_ONLINE_STATUS.AVAILABLE,
    created_at: now,
    updated_at: now
  })

  return success({ worker })
}

async function getWorkerInfo(event, env) {
  const worker = await env.workers.findByUserId(requireOpenid(env))
  return success({ worker })
}

async function getAuditStatus(event, env) {
  const worker = await env.workers.findByUserId(requireOpenid(env))
  if (!worker) {
    return success({
      audit_status: WORKER_AUDIT_STATUS.NOT_APPLIED,
      worker: null
    })
  }

  return success({
    audit_status: worker.audit_status,
    worker
  })
}

async function getWorkerApplyList(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const status = payload.status || WORKER_AUDIT_STATUS.PENDING
  const workers = await env.workers.findByAuditStatus(status)
  return success({ workers })
}

async function approveWorker(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const worker = await requireWorkerById(payload.workerId, env)
  const now = getNow(env)
  const updatedWorker = await env.workers.updateById(worker._id, {
    audit_status: WORKER_AUDIT_STATUS.APPROVED,
    status: WORKER_STATUS.ENABLED,
    reviewer_id: requireOpenid(env),
    approved_at: now,
    updated_at: now
  })

  const workerUser = await env.users.findByOpenid(worker.user_id)
  if (workerUser) {
    await env.users.updateById(workerUser._id, {
      role: USER_ROLE.WORKER,
      updated_at: now
    })
  }

  await safeCreateMessage(env, {
    user_id: worker.user_id,
    title: '入驻审核通过',
    content: '你的师傅入驻申请已通过',
    type: 'worker_approved',
    related_id: worker._id,
    created_at: now,
    updated_at: now
  })

  return success({ worker: updatedWorker })
}

async function rejectWorker(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const worker = await requireWorkerById(payload.workerId, env)
  const now = getNow(env)
  const updatedWorker = await env.workers.updateById(worker._id, {
    audit_status: WORKER_AUDIT_STATUS.REJECTED,
    status: WORKER_STATUS.DISABLED,
    reviewer_id: requireOpenid(env),
    reject_reason: trimText(payload.reason) || '暂未通过审核',
    rejected_at: now,
    updated_at: now
  })

  await safeCreateMessage(env, {
    user_id: worker.user_id,
    title: '入驻审核未通过',
    content: updatedWorker.reject_reason,
    type: 'worker_rejected',
    related_id: worker._id,
    created_at: now,
    updated_at: now
  })

  return success({ worker: updatedWorker })
}

async function getOrderHallList(event, env) {
  const worker = await requireApprovedWorker(env)
  if (worker.status && worker.status !== WORKER_STATUS.ENABLED) {
    return success({ orders: [] })
  }
  if ((worker.online_status || WORKER_ONLINE_STATUS.AVAILABLE) !== WORKER_ONLINE_STATUS.AVAILABLE) {
    return success({ orders: [] })
  }
  const orders = await env.orders.findByStatus('pending_accept')
  const filteredOrders = orders.filter((order) =>
    !order.worker_id &&
    orderMatchesWorkerCategory(order, worker) &&
    orderMatchesWorkerArea(order, worker)
  )
  return success({ orders: filteredOrders })
}

async function updateWorkerOnlineStatus(event, env) {
  const worker = await requireApprovedWorker(env)
  const payload = getPayload(event)
  const onlineStatus = trimText(payload.online_status || payload.onlineStatus)
  if (!Object.values(WORKER_ONLINE_STATUS).includes(onlineStatus)) {
    throw serviceError('WORKER_ONLINE_STATUS_INVALID', '接单状态不合法')
  }
  const updatedWorker = await env.workers.updateById(worker._id, {
    online_status: onlineStatus,
    updated_at: getNow(env)
  })
  return success({ worker: updatedWorker })
}

async function updateWorkerServiceAreas(event, env) {
  const worker = await requireApprovedWorker(env)
  const payload = getPayload(event)
  const serviceAreaIds = Array.isArray(payload.service_area_ids || payload.serviceAreaIds)
    ? (payload.service_area_ids || payload.serviceAreaIds).map((item) => trimText(item)).filter(Boolean)
    : []
  if (!serviceAreaIds.length) {
    throw serviceError('WORKER_SERVICE_AREA_REQUIRED', '请至少选择一个服务小区')
  }
  const nextAreaPayload = await enrichWorkerAreas({
    service_area_ids: serviceAreaIds,
    service_communities: [],
    service_area: '',
    service_city: '',
    service_districts: []
  }, env)
  const updatedWorker = await env.workers.updateById(worker._id, {
    ...nextAreaPayload,
    updated_at: getNow(env)
  })
  return success({ worker: updatedWorker })
}

async function getWorkerDetail(event, env) {
  const payload = getPayload(event)
  if (!payload.workerId) {
    throw serviceError('WORKER_ID_MISSING', '缺少师傅 ID')
  }
  let worker = await env.workers.findById(payload.workerId)
  if (!worker && env.workers.findByUserId) {
    worker = await env.workers.findByUserId(payload.workerId)
  }
  if (!worker) {
    throw serviceError('WORKER_NOT_FOUND', '师傅申请不存在')
  }
  const workerUserId = worker.user_id
  const orders = env.orders && env.orders.findByWorkerId
    ? await env.orders.findByWorkerId(workerUserId)
    : []
  const reviews = env.reviews && env.reviews.findByWorkerId
    ? await env.reviews.findByWorkerId(workerUserId)
    : []
  const completedOrders = orders.filter((order) => order.status === 'completed')
  const ratingSum = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0)
  const averageRating = reviews.length ? Math.round((ratingSum / reviews.length) * 10) / 10 : 0

  return success({
    worker,
    completed_count: completedOrders.length,
    average_rating: averageRating,
    reviews
  })
}

async function adminGetWorkerDetail(event, env) {
  await requireAdmin(env)
  return getWorkerDetail(event, env)
}

const actions = Object.freeze({
  applyWorker,
  getWorkerInfo,
  getAuditStatus,
  getWorkerApplyList,
  approveWorker,
  rejectWorker,
  getOrderHallList,
  getWorkerDetail,
  adminGetWorkerDetail,
  updateWorkerOnlineStatus,
  updateWorkerServiceAreas
})

async function handleWorker(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知师傅操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '师傅操作失败')
  }
}

module.exports = {
  handleWorker,
  applyWorker,
  getWorkerInfo,
  getAuditStatus,
  getWorkerApplyList,
  approveWorker,
  rejectWorker,
  getOrderHallList,
  getWorkerDetail,
  adminGetWorkerDetail,
  updateWorkerOnlineStatus,
  updateWorkerServiceAreas,
  WORKER_AUDIT_STATUS,
  WORKER_STATUS,
  WORKER_ONLINE_STATUS
}
