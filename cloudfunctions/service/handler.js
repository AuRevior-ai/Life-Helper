const { SERVICE_CATEGORIES, SERVICES } = require('./seed-data')

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

function bySort(left, right) {
  return (left.sort || 0) - (right.sort || 0)
}

function getEnabledCategories() {
  return SERVICE_CATEGORIES
    .filter((category) => category.status === 'enabled')
    .slice()
    .sort(bySort)
}

function getOnServices() {
  return SERVICES
    .filter((service) => service.status === 'on')
    .slice()
    .sort(bySort)
}

async function getCategoryList() {
  return success({
    categories: getEnabledCategories()
  })
}

async function getServiceList(event = {}) {
  let services = getOnServices()

  if (event.categoryId) {
    services = services.filter((service) => service.category_id === event.categoryId)
  }

  if (event.recommended) {
    services = services.filter((service) => service.recommended)
  }

  return success({
    services
  })
}

async function getServiceDetail(event = {}) {
  if (!event.serviceId) {
    return fail('SERVICE_ID_MISSING', '缺少服务 ID')
  }

  const service = SERVICES.find((item) => item._id === event.serviceId && item.status === 'on')
  if (!service) {
    return fail('SERVICE_NOT_FOUND', '服务不存在或已下架')
  }

  return success({
    service
  })
}

const actions = Object.freeze({
  getCategoryList,
  getServiceList,
  getServiceDetail
})

async function handleService(event = {}) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知服务操作')
  }

  try {
    return await action(event)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '服务操作失败')
  }
}

module.exports = {
  handleService,
  getCategoryList,
  getServiceList,
  getServiceDetail
}
