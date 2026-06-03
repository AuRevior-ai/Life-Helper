const { CLOUD_FUNCTIONS } = require("../config/constants");
const { createActionService } = require("./_base.service");

module.exports = createActionService(CLOUD_FUNCTIONS.ADMIN, [
  "getDashboard",
  "getAllUsers",
  "disableUser",
  "getAllOrders",
  "getOrderDetail",
  "adminUpdateOrderStatus",
  "getOrderStats",
  "getServiceStats",
]);
