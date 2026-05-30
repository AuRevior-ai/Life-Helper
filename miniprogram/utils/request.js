function assertCloudAvailable() {
  if (typeof wx === 'undefined' || !wx.cloud) {
    throw new Error('WX_CLOUD_NOT_AVAILABLE')
  }
}

function createServiceError(result = {}) {
  const error = new Error(result.message || '请求失败')
  error.errorCode = result.errorCode || 'SERVICE_ERROR'
  return error
}

async function callCloudFunction(name, action, data = {}) {
  assertCloudAvailable()

  const response = await wx.cloud.callFunction({
    name,
    data: {
      action,
      ...data
    }
  })

  const result = response.result || {}
  if (!result.success) {
    throw createServiceError(result)
  }

  return result.data
}

module.exports = {
  callCloudFunction
}
