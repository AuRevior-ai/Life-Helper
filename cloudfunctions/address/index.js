const cloud = require('wx-server-sdk')
const { handleAddress } = require('./handler')
const { createAddressRepository } = require('./address-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleAddress(event, {
    openid: wxContext.OPENID,
    addresses: createAddressRepository(db)
  })
}
