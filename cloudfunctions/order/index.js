const cloud = require('wx-server-sdk')
const { handleOrder } = require('./handler')
const { createAddressReadRepository, createOrderRepository } = require('./order-repository')
const { createDispatchLogRepository } = require('./dispatch-repository')
const { createMessageRepository } = require('./message-repository')
const { createWorkerReadRepository } = require('./worker-read-repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  async function callPromotion(action, payload) {
    const result = await cloud.callFunction({
      name: 'promotion',
      data: {
        action,
        _internal_openid: wxContext.OPENID,
        ...payload
      }
    })
    return result.result || result
  }

  return handleOrder(event, {
    openid: wxContext.OPENID,
    addresses: createAddressReadRepository(db),
    orders: createOrderRepository(db),
    workers: createWorkerReadRepository(db),
    messages: createMessageRepository(db),
    dispatchLogs: createDispatchLogRepository(db),
    promotion: {
      async calculateOrderPromotion(payload) {
        return callPromotion('calculateOrderPromotion', payload)
      },
      async lockCouponForOrder(payload) {
        return callPromotion('lockCouponForOrder', payload)
      },
      async useCouponForOrder(payload) {
        return callPromotion('useCouponForOrder', payload)
      },
      async releaseCouponForOrder(payload) {
        return callPromotion('releaseCouponForOrder', payload)
      }
    }
  })
}
