const cloud = require("wx-server-sdk");
const { handleService } = require("./handler");
const {
  createCategoryRepository,
  createServiceRepository,
  createOrderReadRepository,
  createUserReadRepository,
} = require("./repositories");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  return handleService(event, {
    openid: wxContext.OPENID,
    users: createUserReadRepository(db),
    categories: createCategoryRepository(db),
    services: createServiceRepository(db),
    orders: createOrderReadRepository(db),
  });
};
