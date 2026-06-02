const { success, fail, serviceError } = require('../_shared/response')
const { getPayload } = require('../_shared/payload')
const { getNow } = require('../_shared/time')

const REQUIRED_ADDRESS_FIELDS = ['contact_name', 'phone', 'city', 'community', 'detail_address']

function trimText(value) {
  return `${value || ''}`.trim()
}

function buildFullAddress(address = {}) {
  return [address.city, address.district, address.street, address.community, address.detail_address]
    .map((item) => trimText(item))
    .filter(Boolean)
    .join(' ')
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
  const address = {
    contact_name: trimText(payload.contact_name),
    phone: trimText(payload.phone),
    service_area_id: trimText(payload.service_area_id || payload.serviceAreaId),
    city: trimText(payload.city),
    district: trimText(payload.district),
    street: trimText(payload.street),
    community: trimText(payload.community),
    detail_address: trimText(payload.detail_address),
    is_default: Boolean(payload.is_default)
  }
  return {
    ...address,
    full_address: trimText(payload.full_address) || buildFullAddress(address)
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

async function enrichAddressArea(payload, env) {
  if (!payload.service_area_id) {
    return {
      ...payload,
      full_address: buildFullAddress(payload)
    }
  }

  if (!env.areas || !env.areas.findById) {
    throw serviceError('SERVICE_AREA_REPOSITORY_MISSING', '缺少服务区域集合')
  }

  const area = await env.areas.findById(payload.service_area_id)
  if (!area) {
    throw serviceError('SERVICE_AREA_NOT_FOUND', '服务区域不存在')
  }
  if (area.status === 'disabled') {
    throw serviceError('SERVICE_AREA_DISABLED', '服务区域已禁用')
  }

  const nextPayload = {
    ...payload,
    city: area.city || payload.city,
    district: area.district || payload.district,
    street: area.street || payload.street,
    community: area.community || payload.community
  }
  return {
    ...nextPayload,
    full_address: buildFullAddress(nextPayload)
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
  const payload = await enrichAddressArea(normalizeAddressPayload(getPayload(event)), env)
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
  const nextAddress = await enrichAddressArea(normalizeAddressPayload({
    ...currentAddress,
    ...payload
  }), env)
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
