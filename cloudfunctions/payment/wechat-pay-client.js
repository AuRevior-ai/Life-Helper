function createWechatPayClient(config = {}) {
  return {
    async createPrepay(order) {
      if (!config.enabled) {
        throw new Error('WECHAT_PAY_NOT_CONFIGURED')
      }

      const error = new Error('真实微信支付尚未实现，请使用 mock 支付或完成正式支付接入')
      error.errorCode = 'WECHAT_PAY_NOT_IMPLEMENTED'
      error.out_trade_no = order && order.out_trade_no
      throw error
    }
  }
}

module.exports = {
  createWechatPayClient
}
