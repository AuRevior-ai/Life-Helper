const cloud = require('wx-server-sdk')
const { handleOrder } = require('./handler')
const { createAddressReadRepository, createOrderRepository } = require('./order-repository')
const { createMessageRepository } = require('./message-repository')
const { createWorkerReadRepository } = require('./worker-read-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleOrder(event, {
    openid: wxContext.OPENID,
    addresses: createAddressReadRepository(db),
    orders: createOrderRepository(db),
    workers: createWorkerReadRepository(db),
    messages: createMessageRepository(db)
  })
}
