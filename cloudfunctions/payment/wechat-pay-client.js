function createWechatPayClient(config = {}) {
  return {
    async createPrepay(order) {
      if (!config.enabled) {
        throw new Error('WECHAT_PAY_NOT_CONFIGURED')
      }

      // Real WeChat Pay v3 signing is intentionally left behind configuration.
      // The business flow is ready; merchant credentials must be injected by cloud env.
      return {
        prepay_id: '',
        out_trade_no: order.out_trade_no,
        payParams: {
          timeStamp: '',
          nonceStr: '',
          package: '',
          signType: 'RSA',
          paySign: ''
        }
      }
    }
  }
}

module.exports = {
  createWechatPayClient
}
