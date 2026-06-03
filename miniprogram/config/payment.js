const PAY_MODE = Object.freeze({
  MOCK: "mock",
  WECHAT: "wechat",
});

const CURRENT_PAY_MODE = PAY_MODE.MOCK;

function isWechatPayMode() {
  return CURRENT_PAY_MODE === PAY_MODE.WECHAT;
}

module.exports = {
  PAY_MODE,
  CURRENT_PAY_MODE,
  isWechatPayMode,
};
