const { callCloudFunction } = require("../utils/request");

function createActionService(functionName, actions) {
  return actions.reduce((service, action) => {
    service[action] = (data = {}) =>
      callCloudFunction(functionName, action, data);
    return service;
  }, {});
}

module.exports = {
  createActionService,
};
