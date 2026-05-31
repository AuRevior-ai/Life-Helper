const cloud = require('wx-server-sdk')
const { handleRefund } = require('./handler')
const { createAfterSaleRepository } = require('./after-sale-repository')
const { createMessageRepository } = require('./message-repository')
const { createOrderRepository } = require('./order-repository')
const { createRefundLogRepository } = require('./refund-repository')
const { createUserRepository } = require('./user-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleRefund(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db),
    orders: createOrderRepository(db),
    afterSales: createAfterSaleRepository(db),
    refundLogs: createRefundLogRepository(db),
    messages: createMessageRepository(db)
  })
}
