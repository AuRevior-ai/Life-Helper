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

function createCloudFunctionError(name, error = {}) {
  const rawMessage = error.errMsg || error.message || ''
  const errCode = error.errCode || error.errcode || ''
  const suffix = rawMessage ? `：${rawMessage}` : ''
  const wrapped = new Error(`云函数 ${name} 调用失败，请确认 ${name} 云函数已上传并部署到当前云环境${suffix}`)
  wrapped.errorCode = 'CLOUD_FUNCTION_CALL_FAILED'
  wrapped.errCode = errCode
  return wrapped
}

async function callCloudFunction(name, action, data = {}) {
  assertCloudAvailable()

  let response
  try {
    response = await wx.cloud.callFunction({
      name,
      data: {
        action,
        ...data
      }
    })
  } catch (error) {
    throw createCloudFunctionError(name, error)
  }

  const result = response.result || {}
  if (!result.success) {
    throw createServiceError(result)
  }

  return result.data
}

module.exports = {
  callCloudFunction,
  createCloudFunctionError
}
