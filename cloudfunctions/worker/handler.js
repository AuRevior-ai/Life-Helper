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
  return {
    name: trimText(payload.name),
    phone: trimText(payload.phone),
    service_category: trimText(payload.service_category || payload.serviceCategory),
    service_area: trimText(payload.service_area || payload.serviceArea),
    intro: trimText(payload.intro),
    qualification_images: Array.isArray(payload.qualification_images)
      ? payload.qualification_images
      : []
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
  const payload = normalizeWorkerPayload(getPayload(event))
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

  return success({ worker: updatedWorker })
}

async function getOrderHallList(event, env) {
  await requireApprovedWorker(env)
  const orders = await env.orders.findByStatus('pending_accept')
  return success({ orders })
}

const actions = Object.freeze({
  applyWorker,
  getWorkerInfo,
  getAuditStatus,
  getWorkerApplyList,
  approveWorker,
  rejectWorker,
  getOrderHallList
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
  WORKER_AUDIT_STATUS,
  WORKER_STATUS
}
