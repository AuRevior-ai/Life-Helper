const { success, fail, serviceError } = require('./_shared/response')
const { getPayload } = require('./_shared/payload')
const { getNow } = require('./_shared/time')

const USER_ROLE = Object.freeze({
  USER: 'user',
  WORKER: 'worker',
  ADMIN: 'admin'
})

const USER_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled'
})

const ALLOWED_PROFILE_FIELDS = ['nickname', 'avatar', 'phone']

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean)
  }
  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isAdminBootstrapEnabled(env = {}) {
  return Boolean(env.config && env.config.adminBootstrapEnabled === true)
}

function validateAdminBootstrapGuard(payload = {}, env = {}) {
  if (!isAdminBootstrapEnabled(env)) {
    throw serviceError('ADMIN_BOOTSTRAP_DISABLED', '首个管理员初始化未开启')
  }

  const allowedOpenids = normalizeList(env.config && env.config.adminBootstrapAllowedOpenids)
  if (allowedOpenids.length > 0 && !allowedOpenids.includes(env.openid)) {
    throw serviceError('ADMIN_BOOTSTRAP_OPENID_DENIED', '当前账号不在管理员初始化白名单')
  }

  const expectedCode = `${(env.config && env.config.adminBootstrapCode) || ''}`.trim()
  if (expectedCode && `${payload.initCode || payload.adminBootstrapCode || ''}`.trim() !== expectedCode) {
    throw serviceError('ADMIN_BOOTSTRAP_CODE_INVALID', '管理员初始化码不正确')
  }
}

function pickProfileFields(payload) {
  return ALLOWED_PROFILE_FIELDS.reduce((profile, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      profile[field] = payload[field]
    }
    return profile
  }, {})
}

function isValidRole(role) {
  return Object.values(USER_ROLE).includes(role)
}

async function requireCurrentUser(env) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }

  const user = await env.users.findByOpenid(env.openid)
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

async function getCurrentUser(event, env) {
  const user = await requireCurrentUser(env)
  return success({ user })
}

async function updateUserInfo(event, env) {
  const currentUser = await requireCurrentUser(env)
  const profile = pickProfileFields(getPayload(event))
  const updatedUser = await env.users.updateById(currentUser._id, {
    ...profile,
    updated_at: getNow(env)
  })

  return success({
    user: updatedUser || {
      ...currentUser,
      ...profile
    }
  })
}

async function updateUserRole(event, env) {
  await requireAdmin(env)

  const payload = getPayload(event)
  if (!payload.userId) {
    throw serviceError('USER_ID_MISSING', '缺少用户 ID')
  }
  if (!isValidRole(payload.role)) {
    throw serviceError('USER_ROLE_INVALID', '用户角色不合法')
  }

  const targetUser = await env.users.findById(payload.userId)
  if (!targetUser) {
    throw serviceError('USER_NOT_FOUND', '用户不存在')
  }

  const updatedUser = await env.users.updateById(payload.userId, {
    role: payload.role,
    updated_at: getNow(env)
  })

  return success({
    user: updatedUser
  })
}

async function disableUser(event, env) {
  await requireAdmin(env)

  const payload = getPayload(event)
  if (!payload.userId) {
    throw serviceError('USER_ID_MISSING', '缺少用户 ID')
  }

  const targetUser = await env.users.findById(payload.userId)
  if (!targetUser) {
    throw serviceError('USER_NOT_FOUND', '用户不存在')
  }

  const updatedUser = await env.users.updateById(payload.userId, {
    status: USER_STATUS.DISABLED,
    updated_at: getNow(env)
  })

  return success({
    user: updatedUser
  })
}

async function claimInitialAdmin(event, env) {
  const currentUser = await requireCurrentUser(env)
  const existingAdmin = await env.users.findByRole(USER_ROLE.ADMIN)

  if (existingAdmin) {
    throw serviceError('ADMIN_ALREADY_EXISTS', '管理员已存在，请联系现有管理员分配权限')
  }

  validateAdminBootstrapGuard(getPayload(event), env)

  const updatedUser = await env.users.updateById(currentUser._id, {
    role: USER_ROLE.ADMIN,
    updated_at: getNow(env)
  })

  return success({
    user: updatedUser || {
      ...currentUser,
      role: USER_ROLE.ADMIN
    }
  })
}

const actions = Object.freeze({
  getCurrentUser,
  updateUserInfo,
  updateUserRole,
  disableUser,
  claimInitialAdmin
})

async function handleUser(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知用户操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '用户操作失败')
  }
}

module.exports = {
  handleUser,
  getCurrentUser,
  updateUserInfo,
  updateUserRole,
  disableUser,
  claimInitialAdmin,
  USER_ROLE,
  USER_STATUS
}
