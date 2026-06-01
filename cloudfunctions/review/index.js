const cloud = require('wx-server-sdk')
const { handleReview } = require('./handler')
const { createReviewAppealRepository } = require('./appeal-repository')
const { createMessageRepository } = require('./message-repository')
const { createOrderRepository } = require('./order-repository')
const { createReviewActionLogRepository } = require('./review-log-repository')
const { createReviewRepository } = require('./review-repository')
const { createUserRepository } = require('./user-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  return handleReview(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db),
    orders: createOrderRepository(db),
    reviews: createReviewRepository(db),
    reviewAppeals: createReviewAppealRepository(db),
    reviewActionLogs: createReviewActionLogRepository(db),
    messages: createMessageRepository(db),
    finance: {
      async generateOrderFinance(payload) {
        const result = await cloud.callFunction({
          name: 'finance',
          data: {
            action: 'generateOrderFinance',
            ...payload
          }
        })
        return result.result || result
      }
    }
  })
}
