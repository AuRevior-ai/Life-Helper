const cloud = require('wx-server-sdk')
const { handleDispatch } = require('./handler')
const { createAdminLogRepository } = require('./admin-log-repository')
const { createDispatchLogRepository } = require('./dispatch-repository')
const { createMessageRepository } = require('./message-repository')
const { createOrderRepository } = require('./order-repository')
const { createUserRepository } = require('./user-repository')
const { createWorkerRepository } = require('./worker-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleDispatch(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db),
    orders: createOrderRepository(db),
    workers: createWorkerRepository(db),
    dispatchLogs: createDispatchLogRepository(db),
    adminOperationLogs: createAdminLogRepository(db),
    messages: createMessageRepository(db)
  })
}
