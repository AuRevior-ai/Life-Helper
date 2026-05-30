const cloud = require('wx-server-sdk')
const { handleUser } = require('./handler')
const { createUserRepository } = require('./user-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleUser(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db)
  })
}
