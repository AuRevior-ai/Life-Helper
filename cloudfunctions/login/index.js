const cloud = require('wx-server-sdk')
const { handleLogin } = require('./handler')
const { createUserRepository } = require('./user-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleLogin(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db)
  })
}
