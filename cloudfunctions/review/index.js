const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  return {
    success: false,
    errorCode: 'ACTION_NOT_IMPLEMENTED',
    message: `review.${event.action || 'unknown'} 尚未实现`
  }
}
