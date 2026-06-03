const { CLOUD_FUNCTIONS } = require("../config/constants");
const { createActionService } = require("./_base.service");

module.exports = createActionService(CLOUD_FUNCTIONS.AREA, [
  "getServiceAreaList",
  "adminCreateServiceArea",
  "adminUpdateServiceArea",
  "adminUpdateServiceAreaLocation",
  "adminGetServiceAreaMapList",
  "adminEnableServiceArea",
  "adminDisableServiceArea",
]);
