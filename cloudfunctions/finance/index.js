const cloud = require("wx-server-sdk");
const { handleFinance } = require("./handler");
const {
  createFinanceLogRepository,
  createOrderRepository,
  createUserRepository,
  createWorkerEarningRepository,
} = require("./repositories");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  return handleFinance(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db),
    orders: createOrderRepository(db),
    financeLogs: createFinanceLogRepository(db),
    workerEarnings: createWorkerEarningRepository(db),
  });
};
