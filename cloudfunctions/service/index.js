const cloud = require('wx-server-sdk')
const { handleService } = require('./handler')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  return handleService(event)
}
