const cloud = require("wx-server-sdk");
const { handleWorker } = require("./handler");
const { createMessageRepository } = require("./message-repository");
const { createOrderReadRepository } = require("./order-read-repository");
const { createReviewReadRepository } = require("./review-read-repository");
const { createUserRepository } = require("./user-repository");
const { createWorkerRepository } = require("./worker-repository");
const { createAreaReadRepository } = require("./area-read-repository");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  return handleWorker(event, {
    openid: wxContext.OPENID,
    workers: createWorkerRepository(db),
    users: createUserRepository(db),
    orders: createOrderReadRepository(db),
    reviews: createReviewReadRepository(db),
    messages: createMessageRepository(db),
    areas: createAreaReadRepository(db),
  });
};
