const cloud = require('wx-server-sdk')
const { handleAdmin } = require('./handler')
const {
  createUserRepository,
  createOrderRepository,
  createWorkerRepository,
  createCategoryRepository,
  createServiceRepository
} = require('./repositories')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleAdmin(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db),
    orders: createOrderRepository(db),
    workers: createWorkerRepository(db),
    categories: createCategoryRepository(db),
    services: createServiceRepository(db)
  })
}
