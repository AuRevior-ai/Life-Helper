const USER_ROLE = Object.freeze({
  ADMIN: 'admin'
})

const USER_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled'
})

const SERVICE_AREA_STATUS = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
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

async function requireCurrentUser(env) {
  const user = env.users && env.users.findByOpenid
    ? await env.users.findByOpenid(requireOpenid(env))
    : null
  if (!user || user.status === USER_STATUS.DISABLED) {
    throw serviceError('USER_NOT_FOUND', '用户不存在或已禁用')
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

function buildFullName(area = {}) {
  return [area.city, area.district, area.street, area.community]
    .map((item) => trimText(item))
    .filter(Boolean)
    .join(' ')
}

function normalizeAreaPayload(payload = {}) {
  return {
    city: trimText(payload.city),
    district: trimText(payload.district),
    street: trimText(payload.street),
    community: trimText(payload.community),
    sort: Number.isFinite(Number(payload.sort)) ? Number(payload.sort) : 0
  }
}

function validateAreaPayload(area) {
  if (!area.city || !area.community) {
    throw serviceError('SERVICE_AREA_REQUIRED', '请填写城市和小区')
  }
}

async function getServiceAreaList(event, env) {
  const payload = getPayload(event)
  const includeDisabled = payload.includeDisabled === true
  if (includeDisabled) {
    await requireAdmin(env)
    const areas = await env.areas.findAll()
    return success({ areas })
  }

  const areas = env.areas.findEnabled
    ? await env.areas.findEnabled()
    : (await env.areas.findAll()).filter((area) => area.status === SERVICE_AREA_STATUS.ENABLED)
  return success({ areas })
}

async function adminCreateServiceArea(event, env) {
  await requireAdmin(env)
  const payload = normalizeAreaPayload(getPayload(event))
  validateAreaPayload(payload)
  const now = getNow(env)
  const area = await env.areas.create({
    ...payload,
    full_name: buildFullName(payload),
    status: SERVICE_AREA_STATUS.ENABLED,
    created_at: now,
    updated_at: now
  })
  return success({ area })
}

async function adminUpdateServiceArea(event, env) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.areaId) {
    throw serviceError('SERVICE_AREA_ID_MISSING', '缺少服务区域 ID')
  }
  const current = await env.areas.findById(payload.areaId)
  if (!current) {
    throw serviceError('SERVICE_AREA_NOT_FOUND', '服务区域不存在')
  }
  const nextArea = {
    ...current,
    ...normalizeAreaPayload({ ...current, ...payload })
  }
  validateAreaPayload(nextArea)
  const area = await env.areas.updateById(payload.areaId, {
    city: nextArea.city,
    district: nextArea.district,
    street: nextArea.street,
    community: nextArea.community,
    full_name: buildFullName(nextArea),
    sort: nextArea.sort,
    updated_at: getNow(env)
  })
  return success({ area })
}

async function updateAreaStatus(event, env, status) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.areaId) {
    throw serviceError('SERVICE_AREA_ID_MISSING', '缺少服务区域 ID')
  }
  const area = await env.areas.updateById(payload.areaId, {
    status,
    updated_at: getNow(env)
  })
  if (!area) {
    throw serviceError('SERVICE_AREA_NOT_FOUND', '服务区域不存在')
  }
  return success({ area })
}

function adminEnableServiceArea(event, env) {
  return updateAreaStatus(event, env, SERVICE_AREA_STATUS.ENABLED)
}

function adminDisableServiceArea(event, env) {
  return updateAreaStatus(event, env, SERVICE_AREA_STATUS.DISABLED)
}

const actions = Object.freeze({
  getServiceAreaList,
  adminCreateServiceArea,
  adminUpdateServiceArea,
  adminEnableServiceArea,
  adminDisableServiceArea
})

async function handleArea(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知区域操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '区域操作失败')
  }
}

module.exports = {
  handleArea,
  getServiceAreaList,
  adminCreateServiceArea,
  adminUpdateServiceArea,
  adminEnableServiceArea,
  adminDisableServiceArea,
  SERVICE_AREA_STATUS
}
