const REQUIRED_ADDRESS_FIELDS = ['contact_name', 'phone', 'city', 'community', 'detail_address']

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

function normalizeAddressPayload(payload = {}) {
  return {
    contact_name: trimText(payload.contact_name),
    phone: trimText(payload.phone),
    city: trimText(payload.city),
    community: trimText(payload.community),
    detail_address: trimText(payload.detail_address),
    is_default: Boolean(payload.is_default)
  }
}

function validateAddressPayload(payload) {
  const missing = REQUIRED_ADDRESS_FIELDS.filter((field) => !payload[field])
  if (missing.length > 0) {
    throw serviceError('ADDRESS_REQUIRED', '请填写完整地址信息')
  }

  if (!isPhone(payload.phone)) {
    throw serviceError('ADDRESS_PHONE_INVALID', '手机号格式不正确')
  }
}

async function requireOwnedAddress(addressId, env) {
  if (!addressId) {
    throw serviceError('ADDRESS_ID_MISSING', '缺少地址 ID')
  }

  const address = await env.addresses.findById(addressId)
  if (!address) {
    throw serviceError('ADDRESS_NOT_FOUND', '地址不存在')
  }

  if (address.user_id !== requireOpenid(env)) {
    throw serviceError('PERMISSION_DENIED', '无权操作该地址')
  }

  return address
}

async function getAddressList(event, env) {
  const userId = requireOpenid(env)
  const addresses = await env.addresses.findByUserId(userId)
  return success({ addresses })
}

async function createAddress(event, env) {
  const userId = requireOpenid(env)
  const now = getNow(env)
  const payload = normalizeAddressPayload(getPayload(event))
  validateAddressPayload(payload)

  if (payload.is_default) {
    await env.addresses.clearDefaultForUser(userId, now)
  }

  const address = await env.addresses.create({
    ...payload,
    user_id: userId,
    created_at: now,
    updated_at: now
  })

  return success({ address })
}

async function updateAddress(event, env) {
  const payload = getPayload(event)
  const currentAddress = await requireOwnedAddress(payload.addressId, env)
  const now = getNow(env)
  const nextAddress = normalizeAddressPayload({
    ...currentAddress,
    ...payload
  })
  validateAddressPayload(nextAddress)

  if (nextAddress.is_default) {
    await env.addresses.clearDefaultForUser(currentAddress.user_id, now)
  }

  const address = await env.addresses.updateById(currentAddress._id, {
    ...nextAddress,
    updated_at: now
  })

  return success({ address })
}

async function deleteAddress(event, env) {
  const payload = getPayload(event)
  const address = await requireOwnedAddress(payload.addressId, env)
  await env.addresses.deleteById(address._id)
  return success({ addressId: address._id })
}

async function setDefaultAddress(event, env) {
  const payload = getPayload(event)
  const address = await requireOwnedAddress(payload.addressId, env)
  const now = getNow(env)
  await env.addresses.clearDefaultForUser(address.user_id, now)
  const updatedAddress = await env.addresses.updateById(address._id, {
    is_default: true,
    updated_at: now
  })

  return success({ address: updatedAddress })
}

const actions = Object.freeze({
  getAddressList,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
})

async function handleAddress(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知地址操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '地址操作失败')
  }
}

module.exports = {
  handleAddress,
  getAddressList,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
}
