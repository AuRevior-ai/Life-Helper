async function mockRefund(refundContext = {}) {
  return {
    success: true,
    refund_status: "mock_success",
    refund_channel: "mock",
    raw_data: {
      message: "mock refund success",
      refund_no: refundContext.refund_no,
    },
  };
}

async function wechatRefund() {
  const error = new Error("真实微信退款尚未配置");
  error.errorCode = "WECHAT_REFUND_NOT_CONFIGURED";
  throw error;
}

module.exports = {
  mockRefund,
  wechatRefund,
};
