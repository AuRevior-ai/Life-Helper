const { SERVICE_CATEGORIES, SERVICES } = require('./seed-data')
const { success, fail, serviceError } = require('./_shared/response')
const { getPayload } = require('./_shared/payload')
const { getNow } = require('./_shared/time')

const USER_STATUS = Object.freeze({
  DISABLED: 'disabled'
})

const USER_ROLE = Object.freeze({
  ADMIN: 'admin'
})

const CATEGORY_STATUS = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
})

const SERVICE_STATUS = Object.freeze({
  ON: 'on',
  OFF: 'off'
})

function bySort(left, right) {
  return (left.sort || 0) - (right.sort || 0)
}

function trimText(value) {
  return `${value || ''}`.trim()
}

function requireText(value, errorCode, message) {
  const text = trimText(value)
  if (!text) {
    throw serviceError(errorCode, message)
  }
  return text
}

function requireValidStatus(status, values, errorCode, message) {
  if (!values.includes(status)) {
    throw serviceError(errorCode, message)
  }
  return status
}

function cloneRecords(records) {
  return records.map((record) => ({ ...record }))
}

async function findRecords(repository, seedRecords) {
  if (repository && repository.findAll) {
    const records = await repository.findAll()
    if (records.length) {
      return records
    }
  }

  return cloneRecords(seedRecords)
}

async function getAllCategories(env = {}) {
  const categories = await findRecords(env.categories, SERVICE_CATEGORIES)
  return categories.slice().sort(bySort)
}

async function getAllServices(env = {}) {
  const services = await findRecords(env.services, SERVICES)
  return services.slice().sort(bySort)
}

async function getServicesByCategoryId(categoryId, env = {}) {
  if (env.services && env.services.findByCategoryId) {
    return env.services.findByCategoryId(categoryId)
  }

  if (env.services && env.services.findAll) {
    const services = await env.services.findAll()
    return services.filter((service) => service.category_id === categoryId)
  }

  return []
}

async function getOrdersByServiceId(serviceId, env = {}) {
  if (!env.orders) {
    return []
  }

  if (env.orders.findByServiceId) {
    return env.orders.findByServiceId(serviceId)
  }

  if (env.orders.findAll) {
    const orders = await env.orders.findAll()
    return orders.filter((order) => order.service_id === serviceId)
  }

  return []
}

async function requireAdmin(env = {}) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }

  if (!env.users || !env.users.findByOpenid) {
    throw serviceError('USER_REPOSITORY_MISSING', '缺少用户信息')
  }

  const user = await env.users.findByOpenid(env.openid)
  if (!user || user.status === USER_STATUS.DISABLED) {
    throw serviceError('USER_NOT_FOUND', '管理员用户不存在或已禁用')
  }

  if (user.role !== USER_ROLE.ADMIN) {
    throw serviceError('PERMISSION_DENIED', '当前操作需要管理员权限')
  }

  return user
}

async function getCategoryList(event = {}, env = {}) {
  const payload = getPayload(event)
  let categories = await getAllCategories(env)

  if (!payload.includeDisabled) {
    categories = categories.filter((category) => category.status === CATEGORY_STATUS.ENABLED)
  }

  return success({ categories })
}

async function getServiceList(event = {}, env = {}) {
  const payload = getPayload(event)
  let services = await getAllServices(env)

  if (!payload.includeOff) {
    services = services.filter((service) => service.status === SERVICE_STATUS.ON)
  }

  if (payload.categoryId) {
    services = services.filter((service) => service.category_id === payload.categoryId)
  }

  if (payload.recommended) {
    services = services.filter((service) => service.recommended)
  }

  return success({ services })
}

async function getServiceDetail(event = {}, env = {}) {
  const payload = getPayload(event)
  if (!payload.serviceId) {
    throw serviceError('SERVICE_ID_MISSING', '缺少服务 ID')
  }

  const services = await getAllServices(env)
  const service = services.find((item) => item._id === payload.serviceId)
  if (!service || (!payload.includeOff && service.status !== SERVICE_STATUS.ON)) {
    throw serviceError('SERVICE_NOT_FOUND', '服务不存在或已下架')
  }

  return success({ service })
}

async function seedServiceData(event = {}, env = {}) {
  await requireAdmin(env)
  if (!env.categories || !env.categories.upsert || !env.services || !env.services.upsert) {
    throw serviceError('SERVICE_REPOSITORY_MISSING', '缺少服务目录仓储')
  }

  await Promise.all(SERVICE_CATEGORIES.map((category) => env.categories.upsert({ ...category })))
  await Promise.all(SERVICES.map((service) => env.services.upsert({ ...service })))

  return success({
    category_count: SERVICE_CATEGORIES.length,
    service_count: SERVICES.length
  })
}

async function createCategory(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const now = getNow(env)
  const category = await env.categories.create({
    name: requireText(payload.name, 'CATEGORY_NAME_MISSING', '请填写分类名称'),
    icon: trimText(payload.icon),
    description: trimText(payload.description),
    status: payload.status || CATEGORY_STATUS.ENABLED,
    sort: Number(payload.sort || 0),
    created_at: now,
    updated_at: now
  })

  return success({ category })
}

async function updateCategory(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.categoryId) {
    throw serviceError('CATEGORY_ID_MISSING', '缺少分类 ID')
  }

  const data = {
    updated_at: getNow(env)
  }
  ;['name', 'icon', 'description', 'status', 'sort'].forEach((field) => {
    if (payload[field] !== undefined) {
      data[field] = field === 'sort' ? Number(payload[field] || 0) : payload[field]
    }
  })

  const category = await env.categories.updateById(payload.categoryId, data)
  if (!category) {
    throw serviceError('CATEGORY_NOT_FOUND', '分类不存在')
  }

  return success({ category })
}

async function deleteCategory(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.categoryId) {
    throw serviceError('CATEGORY_ID_MISSING', '缺少分类 ID')
  }

  const relatedServices = await getServicesByCategoryId(payload.categoryId, env)
  if (relatedServices.length > 0) {
    throw serviceError('CATEGORY_HAS_SERVICES', '该分类下仍有服务，请先下架或处理服务')
  }

  const deleted = await env.categories.deleteById(payload.categoryId)
  if (!deleted) {
    throw serviceError('CATEGORY_NOT_FOUND', '分类不存在')
  }

  return success({ deleted: true })
}

async function createService(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  const now = getNow(env)
  const service = await env.services.create({
    category_id: requireText(payload.category_id || payload.categoryId, 'CATEGORY_ID_MISSING', '缺少分类 ID'),
    category_name: trimText(payload.category_name || payload.categoryName),
    name: requireText(payload.name, 'SERVICE_NAME_MISSING', '请填写服务名称'),
    description: trimText(payload.description),
    duration: trimText(payload.duration),
    price: Number(payload.price || 0),
    status: payload.status || SERVICE_STATUS.ON,
    recommended: Boolean(payload.recommended),
    sort: Number(payload.sort || 0),
    created_at: now,
    updated_at: now
  })

  return success({ service })
}

async function updateService(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.serviceId) {
    throw serviceError('SERVICE_ID_MISSING', '缺少服务 ID')
  }

  const data = {
    updated_at: getNow(env)
  }
  ;[
    'category_id',
    'category_name',
    'name',
    'description',
    'duration',
    'price',
    'status',
    'recommended',
    'sort'
  ].forEach((field) => {
    if (payload[field] !== undefined) {
      data[field] = ['price', 'sort'].includes(field)
        ? Number(payload[field] || 0)
        : payload[field]
    }
  })

  if (payload.categoryId !== undefined) data.category_id = payload.categoryId
  if (payload.categoryName !== undefined) data.category_name = payload.categoryName

  const service = await env.services.updateById(payload.serviceId, data)
  if (!service) {
    throw serviceError('SERVICE_NOT_FOUND', '服务不存在')
  }

  return success({ service })
}

async function updateServiceStatus(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.serviceId) {
    throw serviceError('SERVICE_ID_MISSING', '缺少服务 ID')
  }

  const status = requireValidStatus(
    payload.status,
    Object.values(SERVICE_STATUS),
    'SERVICE_STATUS_INVALID',
    '服务状态不合法'
  )
  const service = await env.services.updateById(payload.serviceId, {
    status,
    updated_at: getNow(env)
  })
  if (!service) {
    throw serviceError('SERVICE_NOT_FOUND', '服务不存在')
  }

  return success({ service })
}

async function deleteService(event = {}, env = {}) {
  await requireAdmin(env)
  const payload = getPayload(event)
  if (!payload.serviceId) {
    throw serviceError('SERVICE_ID_MISSING', '缺少服务 ID')
  }

  const relatedOrders = await getOrdersByServiceId(payload.serviceId, env)
  if (relatedOrders.length > 0) {
    throw serviceError('SERVICE_HAS_ORDERS', '该服务已有订单记录，建议下架而不是删除')
  }

  const deleted = await env.services.deleteById(payload.serviceId)
  if (!deleted) {
    throw serviceError('SERVICE_NOT_FOUND', '服务不存在')
  }

  return success({ deleted: true })
}

const actions = Object.freeze({
  getCategoryList,
  getServiceList,
  getServiceDetail,
  seedServiceData,
  createCategory,
  updateCategory,
  deleteCategory,
  createService,
  updateService,
  updateServiceStatus,
  deleteService
})

async function handleService(event = {}, env = {}) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知服务操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '服务操作失败')
  }
}

module.exports = {
  handleService,
  getCategoryList,
  getServiceList,
  getServiceDetail,
  seedServiceData,
  createCategory,
  updateCategory,
  deleteCategory,
  createService,
  updateService,
  updateServiceStatus,
  deleteService
}
