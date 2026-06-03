const cloud = require("wx-server-sdk");
const { handleArea } = require("./handler");
const { createAreaRepository } = require("./area-repository");
const { createUserRepository } = require("./user-repository");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  return handleArea(event, {
    openid: wxContext.OPENID,
    areas: createAreaRepository(db),
    users: createUserRepository(db),
  });
};
