const { CLOUD_FUNCTIONS } = require("../config/constants");
const { createActionService } = require("./_base.service");

module.exports = createActionService(CLOUD_FUNCTIONS.ORDER, [
  "createOrder",
  "mockPayOrder",
  "getUserOrderList",
  "getWorkerOrderList",
  "getOrderDetail",
  "cancelOrder",
  "acceptOrder",
  "startService",
  "finishService",
  "getWorkerIncomeStats",
  "adminGetAllOrders",
  "adminUpdateOrderStatus",
]);
