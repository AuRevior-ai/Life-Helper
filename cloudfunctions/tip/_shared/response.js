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

module.exports = {
  success,
  fail,
  serviceError
}
