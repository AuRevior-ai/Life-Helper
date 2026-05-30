const cloud = require('wx-server-sdk')
const { handleOrder } = require('./handler')
const { createAddressReadRepository, createOrderRepository } = require('./order-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleOrder(event, {
    openid: wxContext.OPENID,
    addresses: createAddressReadRepository(db),
    orders: createOrderRepository(db)
  })
}
