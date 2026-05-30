const cloud = require('wx-server-sdk')
const { handleMessage } = require('./handler')
const { createMessageRepository } = require('./message-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleMessage(event, {
    openid: wxContext.OPENID,
    messages: createMessageRepository(db)
  })
}
