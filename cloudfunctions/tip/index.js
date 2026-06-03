const cloud = require("wx-server-sdk");
const { handleTip } = require("./handler");
const {
  createFinanceLogRepository,
  createMessageRepository,
  createOrderRepository,
  createTipLogRepository,
  createUserRepository,
  createWorkerEarningRepository,
} = require("./repositories");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  return handleTip(event, {
    openid: wxContext.OPENID,
    orders: createOrderRepository(db),
    users: createUserRepository(db),
    tipLogs: createTipLogRepository(db),
    financeLogs: createFinanceLogRepository(db),
    workerEarnings: createWorkerEarningRepository(db),
    messages: createMessageRepository(db),
  });
};
