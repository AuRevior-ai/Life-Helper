const { CLOUD_FUNCTIONS } = require("../config/constants");
const { createActionService } = require("./_base.service");

module.exports = createActionService(CLOUD_FUNCTIONS.REFUND, [
  "createAfterSale",
  "getUserAfterSaleList",
  "getAfterSaleDetail",
  "adminGetAfterSaleList",
  "adminReviewAfterSale",
  "mockRefund",
  "getRefundLogs",
]);
