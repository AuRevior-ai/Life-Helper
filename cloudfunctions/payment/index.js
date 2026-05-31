const cloud = require('wx-server-sdk')
const { handlePayment } = require('./handler')
const { createMessageRepository } = require('./message-repository')
const { createOrderRepository } = require('./order-repository')
const { createPaymentLogRepository } = require('./payment-repository')
const { createWechatPayClient } = require('./wechat-pay-client')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const payMode = process.env.PAY_MODE || 'mock'
  const wechatPayConfig = {
    enabled: payMode === 'wechat',
    appid: process.env.WECHAT_PAY_APPID,
    mchid: process.env.WECHAT_PAY_MCHID,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
    merchantSerialNo: process.env.WECHAT_PAY_SERIAL_NO
  }

  return handlePayment(event, {
    openid: wxContext.OPENID,
    payMode,
    config: {
      payMode,
      wechatPay: wechatPayConfig
    },
    orders: createOrderRepository(db),
    paymentLogs: createPaymentLogRepository(db),
    messages: createMessageRepository(db),
    wechatPayClient: createWechatPayClient(wechatPayConfig)
  })
}
